import { prisma } from "@/lib/db";

export async function createNotification(
  matchmakerId: string,
  type: string,
  payload: Record<string, unknown>
) {
  await prisma.notification.create({
    data: {
      matchmakerId,
      type,
      payload: JSON.stringify(payload),
    },
  });
}

export async function parseMentions(body: string, orgId: string): Promise<string[]> {
  const usernames = Array.from(body.matchAll(/@([a-z0-9_]+)/gi)).map((m) => m[1].toLowerCase());
  if (usernames.length === 0) return [];
  const members = await prisma.membership.findMany({
    where: { orgId, matchmaker: { username: { in: usernames } } },
    select: { matchmakerId: true, matchmaker: { select: { username: true } } },
  });
  return members.map((m) => m.matchmakerId);
}
