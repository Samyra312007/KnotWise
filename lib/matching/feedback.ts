export type IntroFeedbackInput = {
  decision?: "accept" | "decline";
  status?: "accepted" | "declined";
};

export function normalizeIntroDecision(body: IntroFeedbackInput): "accept" | "decline" | null {
  if (body.decision) return body.decision;
  if (body.status === "accepted") return "accept";
  if (body.status === "declined") return "decline";
  return null;
}
