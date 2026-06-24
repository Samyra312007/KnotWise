import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiOps } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { WEIGHTS_EXPERIMENT_KEY, experimentConfig } from "@/lib/matching/experiments";

const patchSchema = z.object({
  kundliEnabled: z.boolean().optional(),
  weightPreset: z.enum(["v1", "v2"]).optional(),
  experimentVariant: z.enum(["control", "treatment"]).optional(),
  mlEnabled: z.boolean().optional(),
});

export async function GET() {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const config = await prisma.orgMatchingConfig.findUnique({ where: { orgId: session.orgId } });
  const experiment = await prisma.matchExperiment.findUnique({
    where: { orgId_key: { orgId: session.orgId, key: WEIGHTS_EXPERIMENT_KEY } },
  });

  return NextResponse.json({
    kundliEnabled: config?.kundliEnabled ?? false,
    weightPreset: config?.weightPreset ?? "v1",
    experimentVariant: config?.experimentVariant ?? "control",
    mlEnabled: config?.mlEnabled ?? false,
    blockSameGotra: config?.blockSameGotra ?? true,
    experiment: experiment
      ? { key: experiment.key, variant: experiment.variant, status: experiment.status }
      : null,
  });
}

export async function PATCH(req: Request) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid config." } }, { status: 400 });
  }

  const config = await prisma.orgMatchingConfig.upsert({
    where: { orgId: session.orgId },
    create: {
      orgId: session.orgId,
      weightsJson: "{}",
      kundliEnabled: parsed.kundliEnabled ?? false,
      weightPreset: parsed.weightPreset ?? "v1",
      experimentVariant: parsed.experimentVariant ?? "control",
      mlEnabled: parsed.mlEnabled ?? false,
    },
    update: {
      ...(parsed.kundliEnabled != null ? { kundliEnabled: parsed.kundliEnabled } : {}),
      ...(parsed.weightPreset != null ? { weightPreset: parsed.weightPreset } : {}),
      ...(parsed.experimentVariant != null ? { experimentVariant: parsed.experimentVariant } : {}),
      ...(parsed.mlEnabled != null ? { mlEnabled: parsed.mlEnabled } : {}),
    },
  });

  if (parsed.experimentVariant) {
    const cfg = experimentConfig(parsed.experimentVariant);
    await prisma.matchExperiment.upsert({
      where: { orgId_key: { orgId: session.orgId, key: WEIGHTS_EXPERIMENT_KEY } },
      create: {
        orgId: session.orgId,
        key: WEIGHTS_EXPERIMENT_KEY,
        variant: parsed.experimentVariant,
        configJson: JSON.stringify(cfg),
      },
      update: {
        variant: parsed.experimentVariant,
        configJson: JSON.stringify(cfg),
        status: "active",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    kundliEnabled: config.kundliEnabled,
    weightPreset: config.weightPreset,
    experimentVariant: config.experimentVariant,
    mlEnabled: config.mlEnabled,
  });
}
