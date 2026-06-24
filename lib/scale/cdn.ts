const CDN_HOSTS = ["utfs.io", "uploadthing.com", "uploadthing-prod.s3.us-west-2.amazonaws.com"];

export function cdnMediaUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  const cdn = process.env.MEDIA_CDN_URL?.replace(/\/$/, "");
  if (!cdn) return url;
  try {
    const parsed = new URL(url);
    if (CDN_HOSTS.some((host) => parsed.hostname.includes(host))) {
      return `${cdn}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return url;
  }
  return url;
}
