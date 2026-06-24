import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { suppressEmail } from "@/lib/scale/email-suppression";

type ResendWebhookData = {
  email_id?: string;
  created_at?: string;
  to?: string[];
  bounce?: { message?: string };
  complaint?: { feedback_type?: string };
};

export async function POST(req: Request) {
  const payload = await req.json();
  const type = payload.type as string;
  const data = payload.data as ResendWebhookData;

  if ((type === "email.delivered" || type === "email.sent") && data.email_id) {
    await prisma.emailLog.updateMany({
      where: { providerId: data.email_id },
      data: {
        deliveryStatus: type === "email.delivered" ? "delivered" : "sent",
        deliveredAt: new Date(),
      },
    });
  }

  if ((type === "email.bounced" || type === "email.complained") && data.email_id) {
    await prisma.emailLog.updateMany({
      where: { providerId: data.email_id },
      data: {
        deliveryStatus: type === "email.bounced" ? "bounced" : "complained",
        errorMessage: type === "email.bounced" ? data.bounce?.message ?? "Bounced" : "Complaint",
      },
    });

    const logs = await prisma.emailLog.findMany({
      where: { providerId: data.email_id },
      select: { recipientEmail: true },
    });
    const recipients = new Set<string>();
    for (const email of data.to ?? []) recipients.add(email);
    for (const log of logs) {
      if (log.recipientEmail) recipients.add(log.recipientEmail);
    }
    for (const email of recipients) {
      await suppressEmail({
        email,
        reason: type === "email.bounced" ? "bounce" : "complaint",
        source: "resend",
        metadata: { emailId: data.email_id, type },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
