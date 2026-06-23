import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { getStripe } from "@/lib/billing/stripe";
import { prisma } from "@/lib/db";

export async function POST() {
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
  if (!org?.stripeCustomerId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "No billing account yet." } },
      { status: 404 }
    );
  }

  const base = process.env.APP_URL ?? "http://localhost:3000";
  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${base}/settings/billing`,
  });

  return NextResponse.json({ url: portal.url });
}
