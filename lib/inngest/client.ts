import { Inngest } from "inngest";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";

export const inngest = new Inngest({ id: "knotwise" });

export const deliverIntroEmail = inngest.createFunction(
  { id: "deliver-intro-email" },
  { event: "email/intro.send" },
  async ({ event }) => {
    const { emailLogId, to, subject, body } = event.data as {
      emailLogId: string;
      to: string;
      subject: string;
      body: string;
    };
    const html = body.replace(/\n/g, "<br/>");
    const result = await sendEmail({ to, subject, html, text: body });
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        deliveryStatus: result.status === "sent" ? "sent" : "failed",
        providerId: result.providerId,
        deliveredAt: result.status === "sent" ? new Date() : undefined,
        errorMessage: result.errorMessage,
        recipientEmail: to,
      },
    });
    return result;
  }
);

export const sendMagicLinkEmail = inngest.createFunction(
  { id: "send-magic-link-email" },
  { event: "email/magic-link.send" },
  async ({ event }) => {
    const { to, subject, html, text } = event.data as {
      to: string;
      subject: string;
      html: string;
      text: string;
    };
    return sendEmail({ to, subject, html, text });
  }
);

export const trainOrgModel = inngest.createFunction(
  { id: "train-org-model" },
  { cron: "0 3 * * 0" },
  async () => {
    const { trainOrgMatchingModel } = await import("@/lib/matching/ml-train");
    const orgs = await prisma.organization.findMany({ select: { id: true } });
    for (const org of orgs) {
      await trainOrgMatchingModel(org.id);
    }
    return { trained: orgs.length };
  }
);

export const sendScheduleReminders = inngest.createFunction(
  { id: "send-schedule-reminders" },
  { cron: "*/15 * * * *" },
  async () => {
    const { sendDueScheduleReminders } = await import("@/lib/scheduling/events");
    return sendDueScheduleReminders();
  }
);

export const inngestFunctions = [deliverIntroEmail, sendMagicLinkEmail, trainOrgModel, sendScheduleReminders];
