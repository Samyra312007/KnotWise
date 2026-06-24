import { NextResponse } from "next/server";
import { z } from "zod";
import { sendDelegateMagicLink } from "@/lib/family/delegates";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Provide a valid email." } }, { status: 400 });
  }

  await sendDelegateMagicLink(parsed.email);

  return NextResponse.json({
    ok: true,
    message: "If that email is registered as a delegate, a link is on its way.",
  });
}
