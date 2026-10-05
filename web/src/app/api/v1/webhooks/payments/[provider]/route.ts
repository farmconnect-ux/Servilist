import { NextResponse, type NextRequest } from "next/server";
import { getPaymentProvider } from "@/server/payments/provider";
import { handlePaymentSuccessAction } from "@/server/services/orders";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider: providerName } = await params;
    const provider = getPaymentProvider(providerName);
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature") ||
                      request.headers.get("verif-hash") ||
                      "mock_signature";

    if (!provider.verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    let orderId: string | undefined;
    let reference: string | undefined;

    if (providerName === "paystack") {
      if (payload.event === "charge.success") {
        orderId = payload.data?.metadata?.order_id;
        reference = payload.data?.reference;
      }
    } else if (providerName === "flutterwave") {
      if (payload.event === "charge.completed" && payload.data?.status === "successful") {
        orderId = payload.data?.meta?.order_id;
        reference = payload.data?.tx_ref;
      }
    } else {
      orderId = payload.orderId;
      reference = payload.reference;
    }

    if (orderId && reference) {
      await handlePaymentSuccessAction(orderId, reference, providerName);
    }

    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Webhook processing failed" },
      { status: 400 },
    );
  }
}
