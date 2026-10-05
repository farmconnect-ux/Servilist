import crypto from "node:crypto";
import { CURRENCIES, isCurrency } from "@/lib/money";

/**
 * Payment providers behind one interface.
 *
 * A provider only does three things: open a checkout for an exact amount,
 * tell us what was really charged for a reference, and prove a webhook came
 * from it. It never decides that an order is paid: the server asks the
 * provider what happened and the database compares that with the order.
 *
 * Secrets are read from the environment at the moment of use. With no secret
 * set a provider is simply unavailable; there is no test or fallback provider.
 */

export const PROVIDER_NAMES = ["paystack", "flutterwave"] as const;
export type ProviderName = (typeof PROVIDER_NAMES)[number];

export function isProviderName(value: unknown): value is ProviderName {
  return typeof value === "string" && (PROVIDER_NAMES as readonly string[]).includes(value);
}

export interface InitializePaymentParams {
  reference: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  callbackUrl: string;
  orderNumber: string;
}

export interface PaymentInitResult {
  reference: string;
  checkoutUrl: string;
  provider: ProviderName;
}

export interface PaymentVerifyResult {
  /** What the provider says happened to this reference. */
  status: "successful" | "failed" | "pending";
  reference: string;
  amountMinor: number;
  currency: string;
  transactionId?: string;
  channel?: string;
  message?: string;
}

export interface PaymentProvider {
  readonly name: ProviderName;
  readonly label: string;
  readonly description: string;
  supportsCurrency(currency: string): boolean;
  initializePayment(params: InitializePaymentParams): Promise<PaymentInitResult>;
  verifyPayment(reference: string): Promise<PaymentVerifyResult>;
  /** True only when the webhook request provably came from the provider. */
  verifyWebhook(rawBody: string, headers: Headers): boolean;
  /** The payment reference a webhook is about, if it reports a charge. */
  webhookReference(payload: unknown): string | null;
}

export class PaymentsUnavailableError extends Error {
  constructor(message = "Online payment is not available yet.") {
    super(message);
    this.name = "PaymentsUnavailableError";
  }
}

export class PaymentProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentProviderError";
  }
}

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json {
  return value && typeof value === "object" ? (value as Json) : {};
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function minorFactor(currency: string): number {
  return isCurrency(currency) ? CURRENCIES[currency].minorFactor : 100;
}

async function callProvider(url: string, secret: string, init?: { body: Json }): Promise<Json> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: init ? "POST" : "GET",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: init ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new PaymentProviderError("The payment provider could not be reached. Please try again.");
  }
  const json = asRecord(await response.json().catch(() => null));
  if (!response.ok) {
    throw new PaymentProviderError(
      typeof json.message === "string" ? json.message : "The payment provider refused the request.",
    );
  }
  return json;
}

/**
 * Paystack. Amounts are sent in the currency's subunit (kobo, pesewas, cents),
 * always one hundredth of the main unit.
 * https://paystack.com/docs/api/transaction/
 */
class PaystackProvider implements PaymentProvider {
  readonly name = "paystack" as const;
  readonly label = "Paystack";
  readonly description = "Cards, bank transfer, USSD and mobile money";
  private static readonly CURRENCIES = ["NGN", "GHS", "KES", "ZAR", "USD", "EGP", "XOF"];

  constructor(private readonly secret: string) {}

  supportsCurrency(currency: string) {
    return PaystackProvider.CURRENCIES.includes(currency.toUpperCase());
  }

  private toSubunit(amountMinor: number, currency: string) {
    return Math.round((amountMinor / minorFactor(currency)) * 100);
  }

  private fromSubunit(amount: number, currency: string) {
    return Math.round((amount / 100) * minorFactor(currency));
  }

  async initializePayment(params: InitializePaymentParams): Promise<PaymentInitResult> {
    const json = await callProvider("https://api.paystack.co/transaction/initialize", this.secret, {
      body: {
        email: params.customerEmail,
        amount: this.toSubunit(params.amountMinor, params.currency),
        currency: params.currency,
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: { order_number: params.orderNumber },
      },
    });
    const url = asRecord(json.data).authorization_url;
    if (typeof url !== "string") throw new PaymentProviderError("Paystack did not return a checkout page.");
    return { reference: params.reference, checkoutUrl: url, provider: this.name };
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    const json = await callProvider(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      this.secret,
    );
    const data = asRecord(json.data);
    const currency = String(data.currency ?? "");
    const state = String(data.status ?? "");
    return {
      status: state === "success" ? "successful" : state === "failed" || state === "abandoned" ? "failed" : "pending",
      reference: String(data.reference ?? reference),
      amountMinor: this.fromSubunit(Number(data.amount ?? 0), currency),
      currency,
      transactionId: data.id !== undefined ? String(data.id) : undefined,
      channel: typeof data.channel === "string" ? data.channel : undefined,
      message: typeof data.gateway_response === "string" ? data.gateway_response : undefined,
    };
  }

  verifyWebhook(rawBody: string, headers: Headers) {
    const signature = headers.get("x-paystack-signature");
    if (!signature) return false;
    const expected = crypto.createHmac("sha512", this.secret).update(rawBody).digest("hex");
    return safeEqual(expected, signature);
  }

  webhookReference(payload: unknown) {
    const body = asRecord(payload);
    if (typeof body.event !== "string" || !body.event.startsWith("charge.")) return null;
    const reference = asRecord(body.data).reference;
    return typeof reference === "string" ? reference : null;
  }
}

/**
 * Flutterwave (v3). Amounts are sent in the main unit. Webhooks carry the
 * secret hash set in the Flutterwave dashboard in the "verif-hash" header.
 * https://developer.flutterwave.com/docs/collecting-payments/standard
 */
class FlutterwaveProvider implements PaymentProvider {
  readonly name = "flutterwave" as const;
  readonly label = "Flutterwave";
  readonly description = "Mobile money (M-Pesa, MTN, Airtel), cards and bank transfer";
  private static readonly CURRENCIES = ["NGN", "GHS", "KES", "ZAR", "USD", "EGP", "RWF", "TZS", "UGX", "XOF"];

  constructor(
    private readonly secret: string,
    private readonly webhookHash: string | undefined,
  ) {}

  supportsCurrency(currency: string) {
    return FlutterwaveProvider.CURRENCIES.includes(currency.toUpperCase());
  }

  async initializePayment(params: InitializePaymentParams): Promise<PaymentInitResult> {
    const json = await callProvider("https://api.flutterwave.com/v3/payments", this.secret, {
      body: {
        tx_ref: params.reference,
        amount: params.amountMinor / minorFactor(params.currency),
        currency: params.currency,
        redirect_url: params.callbackUrl,
        customer: { email: params.customerEmail, name: params.customerName },
        customizations: { title: "Servilist", description: `Order ${params.orderNumber}` },
      },
    });
    const url = asRecord(json.data).link;
    if (typeof url !== "string") throw new PaymentProviderError("Flutterwave did not return a checkout page.");
    return { reference: params.reference, checkoutUrl: url, provider: this.name };
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    const json = await callProvider(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      this.secret,
    );
    const data = asRecord(json.data);
    const currency = String(data.currency ?? "");
    const state = String(data.status ?? "");
    return {
      status: state === "successful" ? "successful" : state === "failed" ? "failed" : "pending",
      reference: String(data.tx_ref ?? reference),
      amountMinor: Math.round(Number(data.amount ?? 0) * minorFactor(currency)),
      currency,
      transactionId: data.id !== undefined ? String(data.id) : undefined,
      channel: typeof data.payment_type === "string" ? data.payment_type : undefined,
      message: typeof data.processor_response === "string" ? data.processor_response : undefined,
    };
  }

  verifyWebhook(_rawBody: string, headers: Headers) {
    const received = headers.get("verif-hash");
    if (!received || !this.webhookHash) return false;
    return safeEqual(this.webhookHash, received);
  }

  webhookReference(payload: unknown) {
    const body = asRecord(payload);
    if (typeof body.event !== "string" || !body.event.startsWith("charge.")) return null;
    const reference = asRecord(body.data).tx_ref;
    return typeof reference === "string" ? reference : null;
  }
}

function build(name: ProviderName): PaymentProvider | null {
  if (name === "paystack") {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    return secret ? new PaystackProvider(secret) : null;
  }
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  return secret ? new FlutterwaveProvider(secret, process.env.FLUTTERWAVE_WEBHOOK_HASH) : null;
}

/** Confirming a payment in the database needs the server secret as well as a provider. */
export function paymentsServerSecret(): string | null {
  const secret = process.env.PAYMENTS_SERVER_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function getPaymentProvider(name?: string): PaymentProvider {
  if (!isProviderName(name)) throw new PaymentsUnavailableError("Unknown payment provider.");
  const provider = build(name);
  if (!provider) throw new PaymentsUnavailableError();
  return provider;
}

/** Providers that are configured and can charge in this currency. */
export function availableProviders(
  currency: string,
): Array<Pick<PaymentProvider, "name" | "label" | "description">> {
  if (!paymentsServerSecret()) return [];
  return PROVIDER_NAMES.map(build)
    .filter((provider): provider is PaymentProvider => provider !== null)
    .filter((provider) => provider.supportsCurrency(currency))
    .map(({ name, label, description }) => ({ name, label, description }));
}
