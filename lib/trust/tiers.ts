export type VerificationTier = "unverified" | "pending" | "verified" | "premium";

export const VERIFICATION_TIER_LABELS: Record<VerificationTier, string> = {
  unverified: "Unverified",
  pending: "Under review",
  verified: "Verified",
  premium: "Premium verified",
};

export function tierBadge(tier: VerificationTier): { label: string; tone: "muted" | "amber" | "green" | "gold" } {
  switch (tier) {
    case "premium":
      return { label: VERIFICATION_TIER_LABELS.premium, tone: "gold" };
    case "verified":
      return { label: VERIFICATION_TIER_LABELS.verified, tone: "green" };
    case "pending":
      return { label: VERIFICATION_TIER_LABELS.pending, tone: "amber" };
    default:
      return { label: VERIFICATION_TIER_LABELS.unverified, tone: "muted" };
  }
}
