import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature, processRazorpayWebhookEvent } from "@/lib/billing/razorpay";
import { isRazorpayDryRun } from "@/lib/billing/razorpay-config";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!isRazorpayDryRun()) {
    if (!verifyRazorpayWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  let event: { id: string; event: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!event.id || !event.event) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const result = await processRazorpayWebhookEvent(event);
  return NextResponse.json({ received: true, ...result });
}
