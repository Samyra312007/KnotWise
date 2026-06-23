import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { sendOtp } from "@/lib/trust/otp";
import { isValidPhone, normalizePhone } from "@/lib/profile/phone";

const schema = z.object({
  channel: z.enum(["sms", "email"]),
  target: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid OTP request." } }, { status: 400 });
  }

  if (parsed.channel === "sms" && !isValidPhone(parsed.target)) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Enter a valid 10-digit mobile number." } },
      { status: 400 }
    );
  }

  const target =
    parsed.channel === "sms" ? normalizePhone(parsed.target) : parsed.target.trim().toLowerCase();

  if (parsed.channel === "email" && target !== session.email.toLowerCase()) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Email must match your account email." } },
      { status: 400 }
    );
  }

  try {
    const result = await sendOtp({
      clientId: session.clientId,
      customerId: session.customerId,
      channel: parsed.channel,
      target,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "RATE_LIMIT") {
        return NextResponse.json(
          { error: { code: "RATE_LIMIT", message: "Too many OTP requests. Try again later." } },
          { status: 429 }
        );
      }
      if (err.message === "LOCKED") {
        return NextResponse.json(
          { error: { code: "LOCKED", message: "Too many failed attempts. Try again in 24 hours." } },
          { status: 423 }
        );
      }
    }
    throw err;
  }
}
