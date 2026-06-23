import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { normalizePhone } from "@/lib/profile/phone";
import { refreshCustomerVerificationTier } from "@/lib/trust/tier-sync";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const MAX_VERIFY_FAILURES = 10;
const LOCKOUT_MS = 24 * 60 * 60 * 1000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function countRecentOtpSends(target: string, channel: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  return prisma.verificationAttempt.count({
    where: { target, channel, createdAt: { gte: since } },
  });
}

export async function sendOtp(input: {
  clientId: string;
  customerId: string;
  channel: "sms" | "email";
  target: string;
}) {
  const normalizedTarget =
    input.channel === "sms" ? normalizePhone(input.target) : input.target.trim().toLowerCase();

  const recent = await countRecentOtpSends(normalizedTarget, input.channel);
  if (recent >= MAX_SENDS_PER_HOUR) {
    throw new Error("RATE_LIMIT");
  }

  const locked = await prisma.verificationAttempt.findFirst({
    where: {
      target: normalizedTarget,
      channel: input.channel,
      failCount: { gte: MAX_VERIFY_FAILURES },
      createdAt: { gte: new Date(Date.now() - LOCKOUT_MS) },
    },
  });
  if (locked) throw new Error("LOCKED");

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  const attempt = await prisma.verificationAttempt.create({
    data: {
      clientId: input.clientId,
      channel: input.channel,
      target: normalizedTarget,
      codeHash,
      expiresAt,
    },
  });

  if (input.channel === "sms") {
    await sendSmsOtp(normalizedTarget, code);
  } else {
    await sendEmail({
      to: normalizedTarget,
      subject: "Your KnotWise verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
  }

  return {
    attemptId: attempt.id,
    expiresAt: expiresAt.toISOString(),
    dryRunCode: process.env.OTP_DRY_RUN === "true" || process.env.EMAIL_DRY_RUN === "true" ? code : undefined,
  };
}

async function sendSmsOtp(phone: string, code: string) {
  if (process.env.OTP_DRY_RUN === "true" || !process.env.MSG91_AUTH_KEY) {
    console.log(JSON.stringify({ scope: "msg91", phone, code, dryRun: true }));
    return;
  }

  const authKey = process.env.MSG91_AUTH_KEY!;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID ?? "";
  const sender = process.env.MSG91_SENDER_ID ?? "KNOTWS";

  const mobile = phone.replace(/\D/g, "").slice(-10);
  const url = new URL("https://control.msg91.com/api/v5/flow/");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authkey: authKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      template_id: templateId,
      short_url: "0",
      recipients: [{ mobiles: `91${mobile}`, otp: code, var: code }],
      sender,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MSG91 failed: ${text}`);
  }
}

export async function verifyOtp(input: { clientId: string; customerId: string; attemptId: string; code: string }) {
  const attempt = await prisma.verificationAttempt.findFirst({
    where: { id: input.attemptId, clientId: input.clientId, verifiedAt: null },
  });
  if (!attempt) throw new Error("NOT_FOUND");
  if (attempt.expiresAt < new Date()) throw new Error("EXPIRED");

  const ok = await bcrypt.compare(input.code.trim(), attempt.codeHash);
  if (!ok) {
    await prisma.verificationAttempt.update({
      where: { id: attempt.id },
      data: { failCount: { increment: 1 } },
    });
    throw new Error("INVALID_CODE");
  }

  await prisma.verificationAttempt.update({
    where: { id: attempt.id },
    data: { verifiedAt: new Date() },
  });

  if (attempt.channel === "sms") {
    await prisma.clientAccount.update({
      where: { id: input.clientId },
      data: { phone: attempt.target },
    });
    await prisma.customer.update({
      where: { id: input.customerId },
      data: { phoneVerifiedAt: new Date() },
    });
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (customer) {
      const biodata = JSON.parse(customer.biodata) as Record<string, unknown>;
      biodata.phone = attempt.target.replace(/^\+91/, "");
      await prisma.customer.update({
        where: { id: input.customerId },
        data: { biodata: JSON.stringify(biodata) },
      });
    }
  }

  const tier = await refreshCustomerVerificationTier(input.customerId);
  return { ok: true as const, tier };
}
