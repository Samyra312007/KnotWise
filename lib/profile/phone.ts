export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return raw.trim();
}

export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return true;
  if (digits.length === 12 && digits.startsWith("91")) return true;
  return false;
}
