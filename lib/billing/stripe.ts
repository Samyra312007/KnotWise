import Stripe from "stripe";
import { prisma } from "@/lib/db";

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

export async function ensureOrgStripeCustomer(orgId: string, orgName: string, email?: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Org not found");
  if (org.stripeCustomerId) return org.stripeCustomerId;
  const s = getStripe();
  if (!s) return null;
  const customer = await s.customers.create({
    name: orgName,
    email,
    metadata: { orgId },
  });
  await prisma.organization.update({
    where: { id: orgId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

export async function syncSubscriptionFromStripe(stripeSubscription: Stripe.Subscription) {
  const orgId = stripeSubscription.metadata.orgId;
  if (!orgId) return;
  const priceId = stripeSubscription.items.data[0]?.price.id ?? "";
  await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      status: stripeSubscription.status,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      seatCount: stripeSubscription.items.data[0]?.quantity ?? 3,
    },
    update: {
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      status: stripeSubscription.status,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      seatCount: stripeSubscription.items.data[0]?.quantity ?? 3,
    },
  });
}
