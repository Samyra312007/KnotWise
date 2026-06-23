const BLOCKED = [
  "bastard",
  "bitch",
  "fuck",
  "shit",
  "asshole",
  "damn",
  "slut",
  "whore",
];

export function containsBlockedContent(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED.some((word) => {
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return pattern.test(lower);
  });
}

export function sanitizeOrRejectMessage(body: string): { ok: true; text: string } | { ok: false; reason: string } {
  const text = body.trim();
  if (!text) return { ok: false, reason: "Message is empty." };
  if (containsBlockedContent(text)) {
    return { ok: false, reason: "Message contains language that is not allowed." };
  }
  return { ok: true, text };
}
