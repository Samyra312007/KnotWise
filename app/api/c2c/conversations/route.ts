import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import {
  counterpartFromMutual,
  listConversationsForCustomer,
} from "@/lib/c2c/conversations";
import { isBlockedEitherWay } from "@/lib/c2c/blocks";

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const rows = await listConversationsForCustomer(session.customerId);

  const items = await Promise.all(
    rows.map(async (row) => {
      const counterpart = counterpartFromMutual(row.mutualMatch, session.customerId);
      const last = row.messages[0];
      const blocked = await isBlockedEitherWay(session.customerId, counterpart.id);

      return {
        id: row.id,
        mutualMatchId: row.mutualMatchId,
        createdAt: row.createdAt.toISOString(),
        counterpart: {
          id: counterpart.id,
          firstName: counterpart.firstName,
          lastName: counterpart.lastName,
          photoUrl: counterpart.photoUrl,
        },
        blocked,
        lastMessage: last
          ? {
              id: last.id,
              body: last.body,
              senderId: last.senderId,
              createdAt: last.createdAt.toISOString(),
              mine: last.senderId === session.customerId,
            }
          : null,
      };
    })
  );

  items.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? a.createdAt;
    const bTime = b.lastMessage?.createdAt ?? b.createdAt;
    return bTime.localeCompare(aTime);
  });

  return NextResponse.json({ items });
}
