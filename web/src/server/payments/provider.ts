import crypto from "crypto";

export interface InitializePaymentParams {
  orderId: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  callbackUrl: string;
}

export interface PaymentInitResult {
  reference: string;
  checkoutUrl: string;
  provider: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  reference: string;
  amountMinor: number;
  currency: string;
  channel?: string;
  gatewayResponse?: string;
  raw?: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  initializePayment(params: InitializePaymentParams): Promise<PaymentInitResult>;
  verifyPayment(reference: string): Promise<PaymentVerifyResult>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}

/** Mock Escrow provider for deterministic local testing and development */
export class MockEscrowProvider implements PaymentProvider {
  readonly name = "mock_escrow";

  async initializePayment(params: InitializePaymentParams): Promise<PaymentInitResult> {
    const reference = `MOCK-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    return {
      reference,
      checkoutUrl: `${params.callbackUrl}?reference=${reference}&status=success`,
      provider: this.name,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    return {
      success: true,
      reference,
      amountMinor: 500000,
      currency: "NGN",
      channel: "mock_test_mode",
      gatewayResponse: "Successful simulated escrow funding",
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    return true; // always valid in mock mode
  }
}

/** Paystack test/live adapter */
export class PaystackProvider implements PaymentProvider {
  readonly name = "paystack";
  private secretKey: string;

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.PAYSTACK_SECRET_KEY || "sk_test_mock_paystack_key";
  }

  async initializePayment(params: InitializePaymentParams): Promise<PaymentInitResult> {
    const reference = `PSTK-${params.orderNumber}-${crypto.randomBytes(4).toString("hex")}`;

    if (this.secretKey.startsWith("sk_test_mock")) {
      // Offline fallback
      return {
        reference,
        checkoutUrl: `${params.callbackUrl}?reference=${reference}&status=success`,
        provider: this.name,
      };
    }

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.customerEmail,
        amount: params.amountMinor, // Paystack uses minor units (kobo/cents)
        currency: params.currency,
        reference,
        callback_url: params.callbackUrl,
        metadata: {
          order_id: params.orderId,
          order_number: params.orderNumber,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      throw new Error(`Paystack initialization failed: ${data.message || "Unknown error"}`);
    }

    return {
      reference,
      checkoutUrl: data.data.authorization_url,
      provider: this.name,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    if (this.secretKey.startsWith("sk_test_mock") || reference.startsWith("MOCK-")) {
      return {
        success: true,
        reference,
        amountMinor: 10000,
        currency: "NGN",
        channel: "test_card",
      };
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      return {
        success: false,
        reference,
        amountMinor: 0,
        currency: "NGN",
        gatewayResponse: data.message,
      };
    }

    const txn = data.data;
    return {
      success: txn.status === "success",
      reference: txn.reference,
      amountMinor: Number(txn.amount),
      currency: txn.currency,
      channel: txn.channel,
      gatewayResponse: txn.gateway_response,
      raw: txn,
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto.createHmac("sha512", this.secretKey).update(payload).digest("hex");
    return hash === signature;
  }
}

/** Flutterwave test/live adapter */
export class FlutterwaveProvider implements PaymentProvider {
  readonly name = "flutterwave";
  private secretKey: string;

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.FLUTTERWAVE_SECRET_KEY || "flw_test_mock_key";
  }

  async initializePayment(params: InitializePaymentParams): Promise<PaymentInitResult> {
    const reference = `FLW-${params.orderNumber}-${crypto.randomBytes(4).toString("hex")}`;

    if (this.secretKey.startsWith("flw_test_mock")) {
      return {
        reference,
        checkoutUrl: `${params.callbackUrl}?reference=${reference}&status=success`,
        provider: this.name,
      };
    }

    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: params.amountMinor / 100, // Flutterwave takes major units
        currency: params.currency,
        redirect_url: params.callbackUrl,
        customer: {
          email: params.customerEmail,
          name: params.customerName,
        },
        meta: {
          order_id: params.orderId,
          order_number: params.orderNumber,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(`Flutterwave initialization failed: ${data.message || "Unknown error"}`);
    }

    return {
      reference,
      checkoutUrl: data.data.link,
      provider: this.name,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    if (this.secretKey.startsWith("flw_test_mock")) {
      return {
        success: true,
        reference,
        amountMinor: 10000,
        currency: "NGN",
        channel: "test_mobile_money",
      };
    }

    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      },
    );

    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      return {
        success: false,
        reference,
        amountMinor: 0,
        currency: "NGN",
        gatewayResponse: data.message,
      };
    }

    const txn = data.data;
    return {
      success: txn.status === "successful",
      reference: txn.tx_ref,
      amountMinor: Math.round(Number(txn.amount) * 100),
      currency: txn.currency,
      channel: txn.payment_type,
      gatewayResponse: txn.processor_response,
      raw: txn,
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH || "mock_flw_hash";
    return signature === secretHash;
  }
}

/** Thrown when no real payment provider is configured for the request. */
export class PaymentsUnavailableError extends Error {
  constructor(message = "Online payment is not available yet.") {
    super(message);
    this.name = "PaymentsUnavailableError";
  }
}

/**
 * The mock provider approves every payment, so it must never be reachable on a
 * deployed site: it needs a non-production build AND an explicit opt-in.
 */
export function mockPaymentsAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_MOCK_PAYMENTS === "true";
}

/**
 * Returns a provider only when it is really configured. There is no default:
 * an unknown or unconfigured provider is an error, never a silent mock, so an
 * order cannot be marked paid without a real, verified payment.
 */
export function getPaymentProvider(providerName?: string): PaymentProvider {
  switch (providerName?.toLowerCase()) {
    case "paystack":
      if (!process.env.PAYSTACK_SECRET_KEY) throw new PaymentsUnavailableError();
      return new PaystackProvider();
    case "flutterwave":
      if (!process.env.FLUTTERWAVE_SECRET_KEY) throw new PaymentsUnavailableError();
      return new FlutterwaveProvider();
    case "mock_escrow":
      if (!mockPaymentsAllowed()) throw new PaymentsUnavailableError();
      return new MockEscrowProvider();
    default:
      throw new PaymentsUnavailableError();
  }
}
