import { NextResponse } from "next/server";
import { requireApiSession, requireApiRole, forbidden } from "@/lib/auth/api";
import { getStripe, ensureOrgStripeCustomer } from "@/lib/billing/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await requireApiRole(["owner"]);
  if (session instanceof NextResponse) return session;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: { code: "NOT_CONFIGURED", message: "Stripe is not configured." } },
      { status: 503 }
    );
  }

  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) return forbidden();

  const customerId = await ensureOrgStripeCustomer(session.orgId, org.name);
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: { code: "NOT_CONFIGURED", message: "STRIPE_PRICE_ID missing." } },
      { status: 503 }
    );
  }

  const base = process.env.APP_URL ?? "http://localhost:3000";
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId ?? undefined,
    line_items: [{ price: priceId, quantity: 3 }],
    success_url: `${base}/settings/billing?success=1`,
    cancel_url: `${base}/settings/billing?canceled=1`,
    metadata: { orgId: session.orgId },
  });

  return NextResponse.json({ url: checkout.url });
}

export async function GET() {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const sub = await prisma.subscription.findUnique({ where: { orgId: session.orgId } });
  return NextResponse.json({
    subscription: sub
      ? {
          status: sub.status,
          seatCount: sub.seatCount,
          currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        }
      : { status: "trialing", seatCount: 2, currentPeriodEnd: null },
  });
}
