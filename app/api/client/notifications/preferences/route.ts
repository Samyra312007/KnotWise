import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";
import { getOrCreateNotificationPreferences } from "@/lib/push/preferences";
import { isPushDryRun } from "@/lib/push/config";
import { recentDryRunPushes } from "@/lib/push/expo";

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const prefs = await getOrCreateNotificationPreferences(session.clientId);

  return NextResponse.json({
    preferences: {
      introPush: prefs.introPush,
      messagePush: prefs.messagePush,
      reminderPush: prefs.reminderPush,
    },
    dryRun: isPushDryRun(),
    recentDryRun: isPushDryRun()
      ? recentDryRunPushes(10).map((message) => ({
          title: message.title,
          body: message.body,
          data: message.data,
        }))
      : [],
  });
}

const patchSchema = z.object({
  introPush: z.boolean().optional(),
  messagePush: z.boolean().optional(),
  reminderPush: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid preferences." } }, { status: 400 });
  }

  if (
    parsed.introPush === undefined &&
    parsed.messagePush === undefined &&
    parsed.reminderPush === undefined
  ) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "No changes provided." } }, { status: 400 });
  }

  const prefs = await getOrCreateNotificationPreferences(session.clientId);
  const updated = await prisma.notificationPreference.update({
    where: { id: prefs.id },
    data: {
      introPush: parsed.introPush ?? prefs.introPush,
      messagePush: parsed.messagePush ?? prefs.messagePush,
      reminderPush: parsed.reminderPush ?? prefs.reminderPush,
    },
  });

  return NextResponse.json({
    preferences: {
      introPush: updated.introPush,
      messagePush: updated.messagePush,
      reminderPush: updated.reminderPush,
    },
  });
}
