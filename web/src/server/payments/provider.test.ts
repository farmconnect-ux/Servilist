import crypto from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PaymentsUnavailableError,
  availableProviders,
  getPaymentProvider,
  isProviderName,
} from "./provider";

const SERVER_SECRET = "s".repeat(40);

function configure() {
  vi.stubEnv("PAYSTACK_SECRET_KEY", "paystack-key-for-tests");
  vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "flutterwave-key-for-tests");
  vi.stubEnv("FLUTTERWAVE_WEBHOOK_HASH", "flutterwave-hash-for-tests");
  vi.stubEnv("PAYMENTS_SERVER_SECRET", SERVER_SECRET);
}

function respondWith(body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentBody(fetchMock: ReturnType<typeof respondWith>): Record<string, unknown> {
  const [, request] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(String(request.body));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("payment provider selection", () => {
  it("has no default, test or mock provider", () => {
    configure();
    expect(() => getPaymentProvider()).toThrow(PaymentsUnavailableError);
    expect(() => getPaymentProvider("mock_escrow")).toThrow(PaymentsUnavailableError);
    expect(isProviderName("mock_escrow")).toBe(false);
  });

  it("refuses providers that are not configured", () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "");
    expect(() => getPaymentProvider("paystack")).toThrow(PaymentsUnavailableError);
    expect(() => getPaymentProvider("flutterwave")).toThrow(PaymentsUnavailableError);
  });

  it("offers nothing until the server secret is set", () => {
    configure();
    vi.stubEnv("PAYMENTS_SERVER_SECRET", "too-short");
    expect(availableProviders("NGN")).toEqual([]);
  });

  it("offers both providers for naira and only Flutterwave for Rwandan francs", () => {
    configure();
    expect(availableProviders("NGN").map((p) => p.name)).toEqual(["paystack", "flutterwave"]);
    expect(availableProviders("RWF").map((p) => p.name)).toEqual(["flutterwave"]);
  });

  it("offers only the provider whose key is present", () => {
    configure();
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    expect(availableProviders("NGN").map((p) => p.name)).toEqual(["flutterwave"]);
  });
});

describe("Paystack", () => {
  const init = {
    reference: "sv_abc_123",
    amountMinor: 1020000,
    currency: "NGN",
    customerEmail: "buyer@example.test",
    customerName: "Buyer",
    callbackUrl: "https://example.test/back",
    orderNumber: "SV-2610-1001",
  };

  it("sends the exact amount in kobo with our reference", async () => {
    configure();
    const fetchMock = respondWith({ data: { authorization_url: "https://checkout.paystack.com/x" } });
    const result = await getPaymentProvider("paystack").initializePayment(init);

    const [url] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = sentBody(fetchMock);
    expect(url).toBe("https://api.paystack.co/transaction/initialize");
    expect(sent.amount).toBe(1020000);
    expect(sent.reference).toBe("sv_abc_123");
    expect(result.checkoutUrl).toBe("https://checkout.paystack.com/x");
  });

  it("charges whole-unit currencies in hundredths, as Paystack expects", async () => {
    configure();
    const fetchMock = respondWith({ data: { authorization_url: "https://checkout.paystack.com/x" } });
    await getPaymentProvider("paystack").initializePayment({
      ...init,
      amountMinor: 5000,
      currency: "XOF",
    });
    expect(sentBody(fetchMock).amount).toBe(500000);
  });

  it("reports what was really charged", async () => {
    configure();
    respondWith({
      data: {
        status: "success",
        reference: "sv_abc_123",
        amount: 1020000,
        currency: "NGN",
        id: 77,
        channel: "card",
      },
    });
    const result = await getPaymentProvider("paystack").verifyPayment("sv_abc_123");
    expect(result).toMatchObject({
      status: "successful",
      amountMinor: 1020000,
      currency: "NGN",
      transactionId: "77",
    });
  });

  it("does not treat an abandoned charge as paid", async () => {
    configure();
    respondWith({
      data: { status: "abandoned", reference: "sv_abc_123", amount: 1020000, currency: "NGN" },
    });
    expect((await getPaymentProvider("paystack").verifyPayment("sv_abc_123")).status).toBe("failed");
  });

  it("accepts only webhooks signed with the secret key", () => {
    configure();
    const provider = getPaymentProvider("paystack");
    const body = JSON.stringify({ event: "charge.success", data: { reference: "sv_abc_123" } });
    const good = crypto.createHmac("sha512", "paystack-key-for-tests").update(body).digest("hex");

    expect(provider.verifyWebhook(body, new Headers({ "x-paystack-signature": good }))).toBe(true);
    expect(provider.verifyWebhook(`${body} `, new Headers({ "x-paystack-signature": good }))).toBe(
      false,
    );
    expect(
      provider.verifyWebhook(body, new Headers({ "x-paystack-signature": "0".repeat(128) })),
    ).toBe(false);
    expect(provider.verifyWebhook(body, new Headers())).toBe(false);
    expect(provider.webhookReference(JSON.parse(body))).toBe("sv_abc_123");
    expect(
      provider.webhookReference({ event: "transfer.success", data: { reference: "x" } }),
    ).toBeNull();
  });
});

describe("Flutterwave", () => {
  it("sends the amount in the main unit with our reference", async () => {
    configure();
    const fetchMock = respondWith({ data: { link: "https://checkout.flutterwave.com/x" } });
    const result = await getPaymentProvider("flutterwave").initializePayment({
      reference: "sv_abc_456",
      amountMinor: 1020000,
      currency: "NGN",
      customerEmail: "buyer@example.test",
      customerName: "Buyer",
      callbackUrl: "https://example.test/back",
      orderNumber: "SV-2610-1002",
    });
    const sent = sentBody(fetchMock);
    expect(sent.amount).toBe(10200);
    expect(sent.tx_ref).toBe("sv_abc_456");
    expect(result.checkoutUrl).toBe("https://checkout.flutterwave.com/x");
  });

  it("reports what was really charged, in minor units", async () => {
    configure();
    respondWith({
      data: { status: "successful", tx_ref: "sv_abc_456", amount: 10200, currency: "NGN", id: 9 },
    });
    const result = await getPaymentProvider("flutterwave").verifyPayment("sv_abc_456");
    expect(result).toMatchObject({ status: "successful", amountMinor: 1020000, currency: "NGN" });
  });

  it("accepts only webhooks carrying the configured hash", () => {
    configure();
    const provider = getPaymentProvider("flutterwave");
    expect(
      provider.verifyWebhook("{}", new Headers({ "verif-hash": "flutterwave-hash-for-tests" })),
    ).toBe(true);
    expect(provider.verifyWebhook("{}", new Headers({ "verif-hash": "wrong" }))).toBe(false);
    expect(provider.verifyWebhook("{}", new Headers())).toBe(false);
  });

  it("rejects every webhook when no hash is configured", () => {
    configure();
    vi.stubEnv("FLUTTERWAVE_WEBHOOK_HASH", "");
    const provider = getPaymentProvider("flutterwave");
    expect(provider.verifyWebhook("{}", new Headers({ "verif-hash": "anything" }))).toBe(false);
  });
});
