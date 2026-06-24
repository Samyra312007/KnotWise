export function isKundliDryRun(): boolean {
  return process.env.KUNDLI_DRY_RUN !== "false";
}

export function isKundliConfigured(): boolean {
  if (isKundliDryRun()) return true;
  return Boolean(process.env.PROKERALA_API_KEY || process.env.ASTROLOGY_API_KEY);
}

type KundliPayload = {
  gunaScore?: number;
  maxGuna?: number;
  manglikMatch?: boolean;
  nadiDosha?: boolean;
};

export function normalizeGunaScore(payload: KundliPayload): number {
  const score = payload.gunaScore ?? 0;
  const max = payload.maxGuna ?? 36;
  if (max <= 0) return 0.5;
  let normalized = score / max;
  if (payload.nadiDosha) normalized *= 0.7;
  if (payload.manglikMatch === false) normalized *= 0.85;
  return Math.max(0, Math.min(1, normalized));
}

export async function fetchKundliFromProvider(input: {
  dateOfBirth: string;
  birthTime: string;
  birthPlace: string;
  gender: "male" | "female";
}): Promise<KundliPayload> {
  if (isKundliDryRun()) {
    const seed =
      input.dateOfBirth.charCodeAt(0) +
      input.birthTime.charCodeAt(0) +
      input.birthPlace.length +
      (input.gender === "male" ? 7 : 3);
    const gunaScore = 18 + (seed % 16);
    return {
      gunaScore,
      maxGuna: 36,
      manglikMatch: gunaScore >= 22,
      nadiDosha: gunaScore < 20,
    };
  }

  const key = process.env.PROKERALA_API_KEY ?? process.env.ASTROLOGY_API_KEY;
  if (!key) throw new Error("NOT_CONFIGURED");

  const res = await fetch("https://api.prokerala.com/v2/astrology/kundli-matching", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      datetime: `${input.dateOfBirth}T${input.birthTime}`,
      place: input.birthPlace,
    }),
  });

  if (!res.ok) throw new Error("KUNDLI_FETCH_FAILED");
  const data = (await res.json()) as { data?: { guna_milan?: { total_points?: number; maximum_points?: number } } };
  return {
    gunaScore: data.data?.guna_milan?.total_points ?? 24,
    maxGuna: data.data?.guna_milan?.maximum_points ?? 36,
  };
}

export function scoreKundliCompatibility(clientJson: string | null, candidateJson: string | null): number {
  if (!clientJson || !candidateJson) return 0.5;
  try {
    const client = JSON.parse(clientJson) as KundliPayload;
    const candidate = JSON.parse(candidateJson) as KundliPayload;
    const clientScore = normalizeGunaScore(client);
    const candidateScore = normalizeGunaScore(candidate);
    return (clientScore + candidateScore) / 2;
  } catch {
    return 0.5;
  }
}
