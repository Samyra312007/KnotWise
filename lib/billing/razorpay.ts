import crypto from "crypto";
import { prisma } from "@/lib/db";
import { CLIENT_PLANS, type ClientPlanId } from "./client-plans";
import {
  isRazorpayConfigured,
  isRazorpayDryRun,
  razorpayKeyId,
  razorpayPlanId,
} from "./razorpay-config";
import { activateClientPlan } from "./client-entitlements";

function authHeader(): string {
  const key = process.env.RAZORPAY_KEY_ID!;
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

async function razorpayFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      authorization: authHeader(),
      "content-type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) {
    throw new Error(data.error?.description ?? `Razorpay ${res.status}`);
  }
  return data;
}

export function verifyRazorpayWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

export async function createClientCheckout(input: {
  customerId: string;
  clientEmail: string;
  clientName: string;
  plan: Exclude<ClientPlanId, "included">;
  idempotencyKey: string;
  gstin?: string;
}) {
  if (!isRazorpayConfigured()) {
    throw new Error("NOT_CONFIGURED");
  }

  const amountInr = CLIENT_PLANS[input.plan].priceInr;
  const existing = await prisma.billingCheckoutSession.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing?.status === "completed") {
    return { sessionId: existing.id, alreadyCompleted: true as const };
  }

  const session =
    existing ??
    (await prisma.billingCheckoutSession.create({
      data: {
        customerId: input.customerId,
        idempotencyKey: input.idempotencyKey,
        plan: input.plan,
        amountInr,
        status: "pending",
      },
    }));

  if (isRazorpayDryRun()) {
    const subId = `dry_sub_${session.id}`;
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await activateClientPlan({
      customerId: input.customerId,
      plan: input.plan,
      provider: "razorpay",
      razorpayCustomerId: `dry_cust_${input.customerId}`,
      razorpaySubscriptionId: subId,
      currentPeriodEnd: periodEnd,
      gstin: input.gstin,
    });

    await prisma.billingCheckoutSession.update({
      where: { id: session.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        razorpaySubId: subId,
        razorpayOrderId: `dry_order_${session.id}`,
      },
    });

    const base = process.env.CLIENT_PORTAL_URL ?? process.env.APP_URL ?? "http://localhost:3000";
    return {
      sessionId: session.id,
      dryRun: true as const,
      checkoutUrl: `${base}/portal/billing?upgraded=${input.plan}`,
      keyId: "dry_run",
      subscriptionId: subId,
    };
  }

  const billing = await prisma.clientBilling.upsert({
    where: { customerId: input.customerId },
    create: { customerId: input.customerId },
    update: {},
  });

  let razorpayCustomerId = billing.razorpayCustomerId;
  if (!razorpayCustomerId) {
    const customer = await razorpayFetch<{ id: string }>("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: input.clientName,
        email: input.clientEmail,
        gstin: input.gstin,
      }),
    });
    razorpayCustomerId = customer.id;
    await prisma.clientBilling.update({
      where: { customerId: input.customerId },
      data: { razorpayCustomerId, gstin: input.gstin },
    });
  }

  const planId = razorpayPlanId(input.plan);
  if (!planId) throw new Error("PLAN_NOT_CONFIGURED");

  const subscription = await razorpayFetch<{ id: string; short_url?: string }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: planId,
      customer_id: razorpayCustomerId,
      total_count: 12,
      customer_notify: 1,
      notes: { customerId: input.customerId, plan: input.plan, sessionId: session.id },
    }),
  });

  await prisma.billingCheckoutSession.update({
    where: { id: session.id },
    data: { razorpaySubId: subscription.id },
  });

  return {
    sessionId: session.id,
    dryRun: false as const,
    checkoutUrl: subscription.short_url,
    keyId: razorpayKeyId(),
    subscriptionId: subscription.id,
  };
}

export async function processRazorpayWebhookEvent(event: {
  id: string;
  event: string;
  payload: Record<string, unknown>;
}) {
  const seen = await prisma.billingWebhookEvent.findUnique({
    where: { provider_eventId: { provider: "razorpay", eventId: event.id } },
  });
  if (seen) return { duplicate: true };

  await prisma.billingWebhookEvent.create({
    data: {
      provider: "razorpay",
      eventId: event.id,
      eventType: event.event,
      payload: JSON.stringify(event.payload),
    },
  });

  const subscriptionEntity = (event.payload.subscription as { entity?: Record<string, unknown> })?.entity;
  const paymentEntity = (event.payload.payment as { entity?: Record<string, unknown> })?.entity;

  const notes =
    (subscriptionEntity?.notes as Record<string, string> | undefined) ??
    (paymentEntity?.notes as Record<string, string> | undefined);
  const customerId = notes?.customerId;
  const plan = notes?.plan as ClientPlanId | undefined;

  if (event.event === "subscription.activated" || event.event === "subscription.charged") {
    if (!customerId || !plan) return { handled: false };
    const subId = String(subscriptionEntity?.id ?? paymentEntity?.subscription_id ?? "");
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);
    await activateClientPlan({
      customerId,
      plan,
      provider: "razorpay",
      razorpaySubscriptionId: subId || undefined,
      currentPeriodEnd: periodEnd,
    });
    if (notes?.sessionId) {
      await prisma.billingCheckoutSession.updateMany({
        where: { id: notes.sessionId },
        data: { status: "completed", completedAt: new Date(), razorpaySubId: subId || undefined },
      });
    }
    return { handled: true };
  }

  if (event.event === "payment.failed") {
    if (!customerId) return { handled: false };
    const { markClientPastDue } = await import("./client-entitlements");
    await markClientPastDue(customerId);
    return { handled: true };
  }

  if (event.event === "subscription.halted" || event.event === "subscription.cancelled") {
    if (!customerId) return { handled: false };
    const { downgradeClientPlan } = await import("./client-entitlements");
    await downgradeClientPlan(customerId, event.event);
    return { handled: true };
  }

  return { handled: false };
}
