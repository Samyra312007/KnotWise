import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { verifyOtp } from "@/lib/trust/otp";

const schema = z.object({
  attemptId: z.string().min(1),
  code: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid verification code." } }, { status: 400 });
  }

  try {
    const result = await verifyOtp({
      clientId: session.clientId,
      customerId: session.customerId,
      attemptId: parsed.attemptId,
      code: parsed.code,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Verification attempt not found." } }, { status: 404 });
    }
    if (err.message === "EXPIRED") {
      return NextResponse.json({ error: { code: "EXPIRED", message: "Code expired. Request a new one." } }, { status: 400 });
    }
    if (err.message === "INVALID_CODE") {
      return NextResponse.json({ error: { code: "INVALID_CODE", message: "Incorrect code." } }, { status: 400 });
    }
    throw err;
  }
}
