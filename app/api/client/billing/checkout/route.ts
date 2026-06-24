import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { createClientCheckout } from "@/lib/billing/razorpay";
import type { ClientPlanId } from "@/lib/billing/client-plans";

const schema = z.object({
  plan: z.enum(["plus", "premium"]),
  idempotencyKey: z.string().min(8).max(128),
  gstin: z.string().max(15).optional(),
});

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid checkout." } }, { status: 400 });
  }

  const account = await prisma.clientAccount.findUnique({
    where: { id: session.clientId },
    include: { customer: true },
  });
  if (!account) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  try {
    const checkout = await createClientCheckout({
      customerId: session.customerId,
      clientEmail: account.email,
      clientName: `${account.customer.firstName} ${account.customer.lastName}`,
      plan: parsed.plan as Exclude<ClientPlanId, "included">,
      idempotencyKey: parsed.idempotencyKey,
      gstin: parsed.gstin,
    });

    if ("alreadyCompleted" in checkout && checkout.alreadyCompleted) {
      return NextResponse.json({ ok: true, alreadyCompleted: true });
    }

    return NextResponse.json({ ok: true, ...checkout });
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (err.message === "NOT_CONFIGURED") {
      return NextResponse.json(
        { error: { code: "NOT_CONFIGURED", message: "Payments are not configured." } },
        { status: 503 }
      );
    }
    if (err.message === "PLAN_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: { code: "NOT_CONFIGURED", message: "Plan is not configured on the server." } },
        { status: 503 }
      );
    }
    throw err;
  }
}
