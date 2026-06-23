export const MAX_PROFILE_PHOTOS = 6;

export const SENSITIVE_FIELD_PATHS = new Set([
  "firstName",
  "lastName",
  "gender",
  "dateOfBirth",
  "maritalStatus",
  "religion",
  "caste",
  "subCaste",
  "gotra",
  "manglik",
  "annualIncomeINR",
  "photoUrl",
]);

export function isSensitiveFieldPath(path: string): boolean {
  return SENSITIVE_FIELD_PATHS.has(path);
}

export function getBiodataFieldValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path.includes(".")) return obj[path];
  const [head, ...rest] = path.split(".");
  const next = obj[head];
  if (next == null || typeof next !== "object") return undefined;
  return getBiodataFieldValue(next as Record<string, unknown>, rest.join("."));
}

export function setBiodataFieldValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  if (!path.includes(".")) {
    obj[path] = value;
    return;
  }
  const [head, ...rest] = path.split(".");
  const current = obj[head];
  const child =
    current != null && typeof current === "object" && !Array.isArray(current)
      ? { ...(current as Record<string, unknown>) }
      : {};
  setBiodataFieldValue(child, rest.join("."), value);
  obj[head] = child;
}

export function serializeFieldValue(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function deserializeFieldValue(raw: string): unknown {
  return JSON.parse(raw) as unknown;
}

export function flattenProfilePatch(
  patch: Record<string, unknown>,
  prefix = ""
): Array<{ path: string; value: unknown }> {
  const entries: Array<{ path: string; value: unknown }> = [];
  for (const [key, value] of Object.entries(patch)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      value != null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      path === "partnerPreferences"
    ) {
      entries.push(...flattenProfilePatch(value as Record<string, unknown>, path));
      continue;
    }
    entries.push({ path, value });
  }
  return entries;
}
