import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { draftIntroEmail } from "@/lib/ai/email";
import type { Biodata } from "@/lib/types";

const schema = z.object({
  customerId: z.string().min(1),
  candidateId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.matchmakerId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Missing customerId or candidateId." } }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.customerId, matchmakerId: session.matchmakerId },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const candidate = await prisma.poolProfile.findUnique({ where: { id: parsed.candidateId } });
  if (!candidate) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Candidate not found." } }, { status: 404 });
  }

  const clientBio = JSON.parse(customer.biodata) as Biodata;
  const candBio = JSON.parse(candidate.biodata) as Biodata;

  const drafted = await draftIntroEmail(clientBio, candBio);
  return NextResponse.json(drafted);
}
