import { prisma } from "@/lib/db";

export async function logAuditEvent(input: {
  orgId: string;
  actorId: string;
  actorType: "matchmaker" | "client" | "system";
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditEvent.create({
    data: {
      orgId: input.orgId,
      actorId: input.actorId,
      actorType: input.actorType,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}

export function logInfo(scope: string, message: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    console.log(JSON.stringify({ level: "info", scope, message, ...data, ts: new Date().toISOString() }));
  }
}

export function logError(scope: string, message: string, err?: unknown) {
  console.error(
    JSON.stringify({
      level: "error",
      scope,
      message,
      error: err instanceof Error ? err.message : String(err),
      ts: new Date().toISOString(),
    })
  );
}
