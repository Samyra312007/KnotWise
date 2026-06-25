import { Resend } from "resend";
import type { EmailPayload, EmailProvider, EmailSendResult } from "./provider";
import { isEmailSuppressed } from "@/lib/scale/email-suppression";

export function emailDryRun(): boolean {
  if (process.env.EMAIL_DRY_RUN === "true") return true;
  if (process.env.EMAIL_DRY_RUN === "false") return false;
  return !process.env.RESEND_API_KEY;
}

export class ResendProvider implements EmailProvider {
  private client: Resend | null;

  constructor() {
    this.client = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  }

  async send(payload: EmailPayload): Promise<EmailSendResult> {
    const dryRun = emailDryRun();
    if (!dryRun && this.client) {
      const suppressed = await isEmailSuppressed(payload.to);
      if (suppressed) {
        return { status: "failed", errorMessage: "Recipient suppressed due to bounce or complaint." };
      }
    }
    if (dryRun || !this.client) {
      const linkMatch = payload.html?.match(/https?:\/\/[^\s"'<>]+/);
      if (linkMatch && process.env.NODE_ENV !== "production") {
        console.log(`[email:dry-run] To: ${payload.to} | ${linkMatch[0]}`);
      } else if (process.env.NODE_ENV !== "production") {
        console.log(`[email:dry-run] To: ${payload.to} Subject: ${payload.subject}`);
      }
      return { status: "sent", providerId: `dry-run-${Date.now()}` };
    }
    const from = process.env.EMAIL_FROM ?? "KnotWise <onboarding@resend.dev>";
    try {
      const result = await this.client.emails.send({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      if (result.error) {
        return { status: "failed", errorMessage: result.error.message };
      }
      return { status: "sent", providerId: result.data?.id };
    } catch (err) {
      return { status: "failed", errorMessage: err instanceof Error ? err.message : "Send failed" };
    }
  }
}

let cached: ResendProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!cached) cached = new ResendProvider();
  return cached;
}

export async function sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
  return getEmailProvider().send(payload);
}
