export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSendResult {
  providerId?: string;
  status: "sent" | "failed";
  errorMessage?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<EmailSendResult>;
}
