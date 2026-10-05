import { afterEach, describe, expect, it, vi } from "vitest";
import { PaymentsUnavailableError, getPaymentProvider, mockPaymentsAllowed } from "./provider";

afterEach(() => vi.unstubAllEnvs());

describe("payment provider selection", () => {
  it("has no default provider", () => {
    expect(() => getPaymentProvider()).toThrow(PaymentsUnavailableError);
    expect(() => getPaymentProvider("anything")).toThrow(PaymentsUnavailableError);
  });

  it("refuses real providers that are not configured", () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "");
    expect(() => getPaymentProvider("paystack")).toThrow(PaymentsUnavailableError);
    expect(() => getPaymentProvider("flutterwave")).toThrow(PaymentsUnavailableError);
  });

  it("never allows the mock provider in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_MOCK_PAYMENTS", "true");
    expect(mockPaymentsAllowed()).toBe(false);
    expect(() => getPaymentProvider("mock_escrow")).toThrow(PaymentsUnavailableError);
  });

  it("allows the mock provider only with an explicit opt-in outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ALLOW_MOCK_PAYMENTS", "");
    expect(() => getPaymentProvider("mock_escrow")).toThrow(PaymentsUnavailableError);
    vi.stubEnv("ALLOW_MOCK_PAYMENTS", "true");
    expect(getPaymentProvider("mock_escrow").name).toBe("mock_escrow");
  });
});
