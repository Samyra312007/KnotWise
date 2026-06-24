import { prisma } from "@/lib/db";
import type { PushCategory } from "@/lib/push/types";

export async function getOrCreateNotificationPreferences(clientId: string) {
  return prisma.notificationPreference.upsert({
    where: { clientId },
    update: {},
    create: { clientId },
  });
}

export async function isPushEnabledForCategory(clientId: string, category: PushCategory) {
  const prefs = await getOrCreateNotificationPreferences(clientId);
  if (category === "intro") return prefs.introPush;
  if (category === "message") return prefs.messagePush;
  return prefs.reminderPush;
}
