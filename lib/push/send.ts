import { prisma } from "@/lib/db";
import { urlsForPayload } from "@/lib/push/deep-links";
import { sendExpoPushBatch } from "@/lib/push/expo";
import { isPushEnabledForCategory } from "@/lib/push/preferences";
import type { PushCategory, PushPayload } from "@/lib/push/types";

export async function resolveClientIdForCustomer(customerId: string) {
  const account = await prisma.clientAccount.findUnique({
    where: { customerId },
    select: { id: true },
  });
  return account?.id ?? null;
}

export async function sendPushToClient(input: {
  clientId: string;
  category: PushCategory;
  title: string;
  body: string;
  payload: PushPayload;
}) {
  const enabled = await isPushEnabledForCategory(input.clientId, input.category);
  if (!enabled) return { sent: 0, skipped: true as const };

  const tokens = await prisma.deviceToken.findMany({
    where: { clientId: input.clientId },
    select: { token: true },
  });
  if (tokens.length === 0) return { sent: 0, skipped: false as const };

  const links = urlsForPayload(input.payload);
  const messages = tokens.map((row) => ({
    to: row.token,
    title: input.title,
    body: input.body,
    data: {
      ...input.payload,
      url: links.url,
      deepLink: links.deepLink,
    },
  }));

  const result = await sendExpoPushBatch(messages);
  if (result.invalidTokens.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: { token: { in: result.invalidTokens } },
    });
  }

  return { sent: result.sent, skipped: false as const };
}

export async function sendPushToCustomer(input: {
  customerId: string;
  category: PushCategory;
  title: string;
  body: string;
  payload: PushPayload;
}) {
  const clientId = await resolveClientIdForCustomer(input.customerId);
  if (!clientId) return { sent: 0, skipped: true as const };
  return sendPushToClient({ ...input, clientId });
}
