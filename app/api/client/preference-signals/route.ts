import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { recordPreferenceSignal } from "@/lib/matching/preference-learning";

const schema = z.object({
  poolProfileId: z.string().optional(),
  suggestionId: z.string().optional(),
  signalType: z.enum(["view", "open", "dwell"]),
  dwellMs: z.number().int().min(0).max(600000).optional(),
});

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid signal." } }, { status: 400 });
  }

  if (!parsed.poolProfileId && !parsed.suggestionId) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Provide poolProfileId or suggestionId." } },
      { status: 400 }
    );
  }

  await recordPreferenceSignal({
    customerId: session.customerId,
    poolProfileId: parsed.poolProfileId,
    suggestionId: parsed.suggestionId,
    signalType: parsed.signalType,
    dwellMs: parsed.dwellMs,
  });

  return NextResponse.json({ ok: true });
}
