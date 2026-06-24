import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import type { AnalyticsEventName } from "./taxonomy";

export function hashCustomerRef(customerId: string): string {
  return createHash("sha256").update(customerId).digest("hex").slice(0, 16);
}

export async function trackAnalyticsEvent(input: {
  orgId: string;
  eventName: AnalyticsEventName | string;
  customerId?: string;
  entityType?: string;
  entityId?: string;
  properties?: Record<string, unknown>;
}) {
  const properties: Record<string, unknown> = { ...(input.properties ?? {}) };
  if (input.customerId && !properties.customerRef) {
    properties.customerRef = hashCustomerRef(input.customerId);
  }

  await prisma.analyticsEvent.create({
    data: {
      orgId: input.orgId,
      eventName: input.eventName,
      customerId: input.customerId,
      entityType: input.entityType,
      entityId: input.entityId,
      properties: JSON.stringify(properties),
    },
  });
}

export function trackAnalyticsEventAsync(input: Parameters<typeof trackAnalyticsEvent>[0]) {
  void trackAnalyticsEvent(input).catch(() => undefined);
}
