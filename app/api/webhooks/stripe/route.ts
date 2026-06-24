import { NextResponse } from "next/server";
import { getStripe, syncSubscriptionFromStripe } from "@/lib/billing/stripe";
import Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orgId = session.metadata?.orgId;
    if (orgId && session.subscription && typeof session.subscription === "string") {
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      sub.metadata.orgId = orgId;
      await syncSubscriptionFromStripe(sub);
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    if (sub.metadata.orgId) {
      await syncSubscriptionFromStripe(sub);
    }
  }

  return NextResponse.json({ received: true });
}
