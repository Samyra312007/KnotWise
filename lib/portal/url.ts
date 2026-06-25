export function portalBaseUrl(): string {
  const raw = process.env.CLIENT_PORTAL_URL ?? "http://localhost:3000/portal";
  return raw.replace(/\/$/, "");
}

export function portalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${portalBaseUrl()}${normalized}`;
}
