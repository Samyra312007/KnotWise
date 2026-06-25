import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { isBlockedEitherWay } from "@/lib/c2c/blocks";
import { counterpartFromMutual } from "@/lib/c2c/conversations";
import { sendEmail } from "@/lib/email/resend";
import {
  scheduleAcceptedEmail,
  scheduleProposalEmail,
  scheduleReminderEmail,
} from "@/lib/email/templates";
import { portalUrl } from "@/lib/portal/url";
import {
  DEFAULT_EVENT_DURATION_MS,
  MIN_SCHEDULE_LEAD_MS,
  REMINDER_WINDOW_MS,
} from "./config";
import { eventTitle, formatWhenLabel } from "./ics";
import { createVideoRoom } from "./video";
import { trackAnalyticsEventAsync } from "@/lib/analytics/track";
import { ANALYTICS_EVENTS } from "@/lib/analytics/taxonomy";

export type ScheduleMode = "in_person" | "video" | "phone";
export type ScheduleStatus = "proposed" | "accepted" | "declined" | "cancelled";
export type ScheduleAction = "accept" | "decline" | "cancel";

export function validateStartsAt(startsAt: Date): string | null {
  const min = Date.now() + MIN_SCHEDULE_LEAD_MS;
  if (startsAt.getTime() < min) {
    return "Schedule at least one hour in advance.";
  }
  return null;
}

export function resolveEndsAt(startsAt: Date, endsAt?: Date | null): Date {
  if (endsAt && endsAt.getTime() > startsAt.getTime()) return endsAt;
  return new Date(startsAt.getTime() + DEFAULT_EVENT_DURATION_MS);
}

async function getMutualForCustomer(mutualMatchId: string, customerId: string) {
  const mutual = await prisma.mutualMatch.findFirst({
    where: {
      id: mutualMatchId,
      status: "active",
      OR: [{ clientAId: customerId }, { clientBId: customerId }],
    },
    include: {
      clientA: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      clientB: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
    },
  });
  if (!mutual) return null;

  const counterpart = counterpartFromMutual(mutual, customerId);
  const blocked = await isBlockedEitherWay(customerId, counterpart.id);
  if (blocked) return null;

  return { mutual, counterpart };
}

export async function listSchedulesForCustomer(customerId: string, mutualMatchId?: string) {
  const rows = await prisma.scheduledEvent.findMany({
    where: {
      ...(mutualMatchId ? { mutualMatchId } : {}),
      mutualMatch: {
        status: "active",
        OR: [{ clientAId: customerId }, { clientBId: customerId }],
      },
    },
    include: {
      mutualMatch: {
        include: {
          clientA: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          clientB: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        },
      },
      proposedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  return rows.map((row) => serializeSchedule(row, customerId));
}

export async function getScheduleForCustomer(eventId: string, customerId: string) {
  const row = await prisma.scheduledEvent.findFirst({
    where: {
      id: eventId,
      mutualMatch: {
        status: "active",
        OR: [{ clientAId: customerId }, { clientBId: customerId }],
      },
    },
    include: {
      mutualMatch: {
        include: {
          clientA: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          clientB: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        },
      },
      proposedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!row) return null;
  return serializeSchedule(row, customerId);
}

function serializeSchedule(
  row: {
    id: string;
    mutualMatchId: string;
    proposedById: string;
    startsAt: Date;
    endsAt: Date | null;
    mode: string;
    title: string | null;
    location: string | null;
    status: string;
    videoLink: string | null;
    videoProvider: string | null;
    createdAt: Date;
    updatedAt: Date;
    mutualMatch: {
      clientAId: string;
      clientBId: string;
      clientA: { id: string; firstName: string; lastName: string; photoUrl: string | null };
      clientB: { id: string; firstName: string; lastName: string; photoUrl: string | null };
    };
    proposedBy: { id: string; firstName: string; lastName: string };
  },
  customerId: string
) {
  const counterpart = counterpartFromMutual(row.mutualMatch, customerId);
  const endsAt = resolveEndsAt(row.startsAt, row.endsAt);
  return {
    id: row.id,
    mutualMatchId: row.mutualMatchId,
    proposedById: row.proposedById,
    mine: row.proposedById === customerId,
    startsAt: row.startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    mode: row.mode,
    title: row.title ?? eventTitle(row.mode, `${counterpart.firstName} ${counterpart.lastName}`),
    location: row.location,
    status: row.status,
    videoLink: row.status === "accepted" ? row.videoLink : null,
    videoProvider: row.videoProvider,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    counterpart: {
      id: counterpart.id,
      firstName: counterpart.firstName,
      lastName: counterpart.lastName,
      photoUrl: counterpart.photoUrl,
    },
    proposedBy: row.proposedBy,
  };
}

export async function proposeSchedule(input: {
  customerId: string;
  orgId: string;
  clientId: string;
  mutualMatchId: string;
  startsAt: Date;
  endsAt?: Date;
  mode: ScheduleMode;
  title?: string;
  location?: string;
}) {
  const access = await getMutualForCustomer(input.mutualMatchId, input.customerId);
  if (!access) throw new Error("FORBIDDEN");

  const leadError = validateStartsAt(input.startsAt);
  if (leadError) throw new Error("INVALID_INPUT");

  if (input.mode === "in_person" && !input.location?.trim()) {
    throw new Error("INVALID_INPUT");
  }

  const endsAt = resolveEndsAt(input.startsAt, input.endsAt);
  const counterpartName = `${access.counterpart.firstName} ${access.counterpart.lastName}`;
  const title = input.title?.trim() || eventTitle(input.mode, counterpartName);

  const event = await prisma.scheduledEvent.create({
    data: {
      mutualMatchId: input.mutualMatchId,
      proposedById: input.customerId,
      startsAt: input.startsAt,
      endsAt,
      mode: input.mode,
      title,
      location: input.mode === "in_person" ? input.location?.trim() : null,
      status: "proposed",
    },
  });

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.clientId,
    actorType: "client",
    action: "schedule.proposed",
    entityType: "scheduled_event",
    entityId: event.id,
    metadata: { mutualMatchId: input.mutualMatchId, mode: input.mode },
  });

  const proposer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { firstName: true, lastName: true },
  });
  const proposerName = proposer ? `${proposer.firstName} ${proposer.lastName}` : "Your match";

  const account = await prisma.clientAccount.findUnique({
    where: { customerId: access.counterpart.id },
    select: { email: true, notifyEmail: true, customer: { select: { firstName: true } } },
  });
  if (account?.notifyEmail) {
    const mail = scheduleProposalEmail({
      firstName: account.customer.firstName ?? account.email.split("@")[0],
      proposerName,
      whenLabel: formatWhenLabel(input.startsAt),
      mode: input.mode,
      portalLink: portalUrl(`/reminders/${event.id}`),
    });
    void sendEmail({ to: account.email, ...mail }).catch(() => undefined);
  }

  return getScheduleForCustomer(event.id, input.customerId);
}

export async function respondToSchedule(input: {
  eventId: string;
  customerId: string;
  orgId: string;
  clientId: string;
  action: ScheduleAction;
}) {
  const existing = await prisma.scheduledEvent.findFirst({
    where: {
      id: input.eventId,
      mutualMatch: {
        status: "active",
        OR: [{ clientAId: input.customerId }, { clientBId: input.customerId }],
      },
    },
    include: {
      mutualMatch: {
        include: {
          clientA: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          clientB: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        },
      },
    },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const counterpart = counterpartFromMutual(existing.mutualMatch, input.customerId);
  const blocked = await isBlockedEitherWay(input.customerId, counterpart.id);
  if (blocked) throw new Error("FORBIDDEN");

  if (input.action === "cancel") {
    if (existing.status === "cancelled" || existing.status === "declined") {
      throw new Error("INVALID_STATE");
    }
    if (existing.proposedById !== input.customerId && existing.status !== "accepted") {
      throw new Error("FORBIDDEN");
    }
  } else if (existing.status !== "proposed") {
    throw new Error("INVALID_STATE");
  }

  if (input.action === "accept" && existing.proposedById === input.customerId) {
    throw new Error("FORBIDDEN");
  }

  if (input.action === "decline" && existing.proposedById === input.customerId) {
    throw new Error("FORBIDDEN");
  }

  const now = new Date();
  let videoLink: string | null = existing.videoLink;
  let videoRoomId: string | null = existing.videoRoomId;
  let videoProvider: string | null = existing.videoProvider;
  let status: ScheduleStatus;

  if (input.action === "accept") {
    status = "accepted";
    if (existing.mode === "video") {
      const endsAt = resolveEndsAt(existing.startsAt, existing.endsAt);
      const room = await createVideoRoom({ eventId: existing.id, expiresAt: endsAt });
      videoLink = room.url;
      videoRoomId = room.roomId;
      videoProvider = room.provider;
    }
  } else if (input.action === "decline") {
    status = "declined";
  } else {
    status = "cancelled";
  }

  await prisma.scheduledEvent.update({
    where: { id: existing.id },
    data: {
      status,
      respondedAt: now,
      videoLink,
      videoRoomId,
      videoProvider,
    },
  });

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.clientId,
    actorType: "client",
    action: `schedule.${input.action}ed`,
    entityType: "scheduled_event",
    entityId: existing.id,
    metadata: { status },
  });

  if (input.action === "accept") {
    trackAnalyticsEventAsync({
      orgId: input.orgId,
      eventName: ANALYTICS_EVENTS.SCHEDULE_ACCEPTED,
      customerId: input.customerId,
      entityType: "scheduled_event",
      entityId: existing.id,
      properties: { mode: existing.mode },
    });
  }

  if (input.action === "accept") {
    const accepter = await prisma.customer.findUnique({
      where: { id: input.customerId },
      select: { firstName: true, lastName: true },
    });
    const proposer = await prisma.customer.findUnique({
      where: { id: existing.proposedById },
      select: { firstName: true, lastName: true },
    });
    const accepterName = accepter ? `${accepter.firstName} ${accepter.lastName}` : "Your match";
    const proposerName = proposer ? `${proposer.firstName} ${proposer.lastName}` : "Your match";
    const whenLabel = formatWhenLabel(existing.startsAt);

    for (const [recipientId, counterpartName] of [
      [existing.proposedById, accepterName],
      [input.customerId, proposerName],
    ] as const) {
      const account = await prisma.clientAccount.findUnique({
        where: { customerId: recipientId },
        select: { email: true, notifyEmail: true, customer: { select: { firstName: true } } },
      });
      if (!account?.notifyEmail) continue;
      const mail = scheduleAcceptedEmail({
        firstName: account.customer.firstName ?? account.email.split("@")[0],
        counterpartName,
        whenLabel,
        mode: existing.mode,
        videoLink: videoLink ?? undefined,
        portalLink: portalUrl(`/reminders/${existing.id}`),
      });
      void sendEmail({ to: account.email, ...mail }).catch(() => undefined);
    }
  }

  return getScheduleForCustomer(existing.id, input.customerId);
}

export async function sendDueScheduleReminders() {
  const now = Date.now();
  const windowStart = new Date(now + REMINDER_WINDOW_MS - 5 * 60 * 1000);
  const windowEnd = new Date(now + REMINDER_WINDOW_MS + 5 * 60 * 1000);

  const due = await prisma.scheduledEvent.findMany({
    where: {
      status: "accepted",
      reminderSentAt: null,
      startsAt: { gte: windowStart, lte: windowEnd },
    },
    include: {
      mutualMatch: {
        include: {
          clientA: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          clientB: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        },
      },
    },
  });

  let sent = 0;
  for (const event of due) {
    const whenLabel = formatWhenLabel(event.startsAt);
    const title = event.title ?? "Upcoming date";

    for (const customerId of [event.mutualMatch.clientAId, event.mutualMatch.clientBId]) {
      const account = await prisma.clientAccount.findUnique({
        where: { customerId },
        select: { email: true, notifyEmail: true, customer: { select: { firstName: true } } },
      });
      if (account?.notifyEmail) {
        const mail = scheduleReminderEmail({
          firstName: account.customer.firstName ?? account.email.split("@")[0],
          title,
          whenLabel,
          videoLink: event.videoLink ?? undefined,
          portalLink: portalUrl(`/reminders/${event.id}`),
        });
        void sendEmail({ to: account.email, ...mail }).catch(() => undefined);
      }
    }

    await prisma.scheduledEvent.update({
      where: { id: event.id },
      data: { reminderSentAt: new Date() },
    });
    sent += 1;
  }

  return { sent };
}
