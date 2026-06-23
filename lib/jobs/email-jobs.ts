import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";

export async function deliverIntroEmailInline(data: {
  emailLogId: string;
  to: string;
  subject: string;
  body: string;
}) {
  const html = data.body.replace(/\n/g, "<br/>");
  const result = await sendEmail({
    to: data.to,
    subject: data.subject,
    html,
    text: data.body,
  });
  await prisma.emailLog.update({
    where: { id: data.emailLogId },
    data: {
      deliveryStatus: result.status === "sent" ? "sent" : "failed",
      providerId: result.providerId,
      deliveredAt: result.status === "sent" ? new Date() : undefined,
      errorMessage: result.errorMessage,
      recipientEmail: data.to,
    },
  });
  return result;
}

export async function enqueueIntroEmail(data: {
  emailLogId: string;
  to: string;
  subject: string;
  body: string;
}) {
  if (process.env.INNGEST_EVENT_KEY) {
    const { inngest } = await import("@/lib/inngest/client");
    await inngest.send({ name: "email/intro.send", data });
    return;
  }
  void deliverIntroEmailInline(data);
}

export async function enqueueMagicLinkEmail(data: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (process.env.INNGEST_EVENT_KEY) {
    const { inngest } = await import("@/lib/inngest/client");
    await inngest.send({ name: "email/magic-link.send", data });
    return;
  }
  await sendEmail(data);
}
