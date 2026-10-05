import { NextResponse, type NextRequest } from "next/server";
import { PaymentsUnavailableError, getPaymentProvider } from "@/server/payments/provider";
import { settlePayment } from "@/server/services/orders";

/**
 * Payment provider webhooks.
 *
 * The body is used for one thing only: to learn which payment reference to
 * look at. Whether it was paid, and how much, is then asked of the provider
 * directly, and the database checks that amount against the order.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  let provider;
  try {
    provider = getPaymentProvider((await params).provider);
  } catch (err) {
    if (err instanceof PaymentsUnavailableError) {
      return NextResponse.json({ error: "Unknown payment provider" }, { status: 404 });
    }
    throw err;
  }

  const rawBody = await request.text();
  if (!provider.verifyWebhook(rawBody, request.headers)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const reference = provider.webhookReference(payload);
  if (reference) {
    const result = await settlePayment(provider.name, reference);
    // A failure here is ours, not the provider's: ask it to retry later
    if (!result.ok && result.code !== "NOT_FOUND") {
      return NextResponse.json({ error: "Could not record the payment" }, { status: 500 });
    }
  }

  return NextResponse.json({ status: "received" });
}
