import type { Biodata } from "@/lib/types";

export function normalizeGotra(value?: string | null): string | null {
  if (!value?.trim()) return null;
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function isSameGotra(client: Biodata, candidate: Biodata): boolean {
  const a = normalizeGotra(client.gotra);
  const b = normalizeGotra(candidate.gotra);
  if (!a || !b) return false;
  return a === b;
}

export function gotraConflictMessage(client: Biodata, candidate: Biodata): string | null {
  if (!isSameGotra(client, candidate)) return null;
  return `Same gotra (${client.gotra}) — intro blocked by bureau policy. Override required to send.`;
}
