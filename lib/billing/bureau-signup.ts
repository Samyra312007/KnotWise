import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { getStripe, ensureOrgStripeCustomer } from "./stripe";

const TRIAL_DAYS = 14;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function signupBureau(input: {
  orgName: string;
  slug?: string;
  ownerName: string;
  username: string;
  email: string;
  password: string;
}) {
  const slug = slugify(input.slug ?? input.orgName);
  if (!slug || slug.length < 3) throw new Error("INVALID_SLUG");

  const username = input.username.toLowerCase().trim();
  const [existingOrg, existingUser] = await Promise.all([
    prisma.organization.findUnique({ where: { slug } }),
    prisma.matchmaker.findUnique({ where: { username } }),
  ]);
  if (existingOrg) throw new Error("SLUG_TAKEN");
  if (existingUser) throw new Error("USERNAME_TAKEN");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  const org = await prisma.organization.create({
    data: { name: input.orgName.trim(), slug },
  });

  const matchmaker = await prisma.matchmaker.create({
    data: {
      username,
      fullName: input.ownerName.trim(),
      passwordHash,
    },
  });

  await prisma.membership.create({
    data: { orgId: org.id, matchmakerId: matchmaker.id, role: "owner" },
  });

  await prisma.subscription.create({
    data: {
      orgId: org.id,
      stripeSubscriptionId: `trial_${org.id}`,
      stripePriceId: "trial",
      status: "trialing",
      currentPeriodEnd: trialEnd,
      seatCount: 2,
    },
  });

  await prisma.orgMatchingConfig.create({
    data: {
      orgId: org.id,
      weightsJson: JSON.stringify({ male: {}, female: {} }),
      mlEnabled: false,
      blockSameGotra: true,
      discoveryEnabled: false,
      discoveryDailyLimit: 20,
    },
  });

  await logAuditEvent({
    orgId: org.id,
    actorId: matchmaker.id,
    actorType: "matchmaker",
    action: "org.signup",
    entityType: "organization",
    entityId: org.id,
    metadata: { email: input.email, slug },
  });

  let stripeCheckoutUrl: string | undefined;
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  if (stripe && priceId) {
    const customerId = await ensureOrgStripeCustomer(org.id, org.name);
    const base = process.env.APP_URL ?? "http://localhost:3000";
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId ?? undefined,
      line_items: [{ price: priceId, quantity: 2 }],
      subscription_data: { trial_period_days: TRIAL_DAYS, metadata: { orgId: org.id } },
      success_url: `${base}/login?signup=1`,
      cancel_url: `${base}/signup/bureau?canceled=1`,
      metadata: { orgId: org.id },
    });
    stripeCheckoutUrl = checkout.url ?? undefined;
  }

  return {
    orgId: org.id,
    slug: org.slug,
    matchmakerId: matchmaker.id,
    username,
    trialEndsAt: trialEnd.toISOString(),
    stripeCheckoutUrl,
  };
}
