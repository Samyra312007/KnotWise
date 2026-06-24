import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyDelegateMagicLink } from "@/lib/family/delegates";
import { establishDelegateSession } from "@/lib/auth/delegate-session";

const schema = z.object({ token: z.string().min(16) });

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid token." } }, { status: 400 });
  }

  try {
    const delegate = await verifyDelegateMagicLink(parsed.token);
    await establishDelegateSession({
      id: delegate.id,
      customerId: delegate.customerId,
      email: delegate.email,
      role: delegate.role,
    });

    return NextResponse.json({
      ok: true,
      redirect: "/portal/delegate",
      delegate: {
        id: delegate.id,
        role: delegate.role,
        clientFirstName: delegate.customer.firstName,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_TOKEN") {
      return NextResponse.json({ error: { code: "INVALID_TOKEN", message: "Link expired or invalid." } }, { status: 400 });
    }
    throw err;
  }
}
