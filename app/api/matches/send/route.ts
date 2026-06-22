import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { Biodata } from "@/lib/types";
import { rankMatches } from "@/lib/matching";

const schema = z.object({
  customerId: z.string().min(1),
  candidateId: z.string().min(1),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(8000),
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
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Provide all fields." } }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.customerId, matchmakerId: session.matchmakerId },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Customer not found." } }, { status: 404 });
  }
  const candidate = await prisma.poolProfile.findUnique({ where: { id: parsed.candidateId } });
  if (!candidate) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Candidate not found." } }, { status: 404 });
  }

  const clientBio = JSON.parse(customer.biodata) as Biodata;
  const candBio = JSON.parse(candidate.biodata) as Biodata;
  const ranked = rankMatches(clientBio, [{ id: candidate.id, biodata: candBio }]);
  const m = ranked[0];

  const suggestion = await prisma.matchSuggestion.upsert({
    where: {
      customerId_poolProfileId: {
        customerId: customer.id,
        poolProfileId: candidate.id,
      },
    },
    update: { status: "sent" },
    create: {
      customerId: customer.id,
      poolProfileId: candidate.id,
      score: m?.score ?? 0,
      bucket: m?.bucket ?? "low",
      explanation: "",
      breakdown: JSON.stringify(m?.breakdown ?? {}),
      status: "sent",
    },
  });

  const email = await prisma.emailLog.create({
    data: {
      matchSuggestionId: suggestion.id,
      matchmakerId: session.matchmakerId,
      subject: parsed.subject,
      body: parsed.body,
    },
  });

  let stageBumped = false;
  if (customer.stage === "Active") {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { stage: "Match Sent" },
    });
    stageBumped = true;
  }

  return NextResponse.json({
    ok: true,
    suggestionId: suggestion.id,
    emailId: email.id,
    stageBumped,
  });
}
