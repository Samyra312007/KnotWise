import { NextResponse } from "next/server";
import { z } from "zod";
import { signupBureau } from "@/lib/billing/bureau-signup";

const schema = z.object({
  orgName: z.string().min(2).max(120),
  slug: z.string().min(3).max(48).optional(),
  ownerName: z.string().min(2).max(120),
  username: z.string().min(3).max(32).regex(/^[a-z0-9_]+$/i),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Check all fields." } }, { status: 400 });
  }

  try {
    const result = await signupBureau(parsed);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    const map: Record<string, { code: string; message: string; status: number }> = {
      SLUG_TAKEN: { code: "SLUG_TAKEN", message: "That bureau URL is already taken.", status: 409 },
      USERNAME_TAKEN: { code: "USERNAME_TAKEN", message: "That username is already taken.", status: 409 },
      INVALID_SLUG: { code: "INVALID_INPUT", message: "Choose a valid bureau URL slug.", status: 400 },
    };
    const hit = map[err.message];
    if (hit) {
      return NextResponse.json({ error: { code: hit.code, message: hit.message } }, { status: hit.status });
    }
    throw err;
  }
}
