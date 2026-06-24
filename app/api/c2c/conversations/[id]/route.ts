import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import {
  counterpartFromMutual,
  getConversationForCustomer,
} from "@/lib/c2c/conversations";
import { isBlockedEitherWay } from "@/lib/c2c/blocks";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  const row = await getConversationForCustomer(id, session.customerId);
  if (!row) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Conversation not found." } }, { status: 404 });
  }

  const counterpart = counterpartFromMutual(row.mutualMatch, session.customerId);
  const last = row.messages[0];
  const blocked = await isBlockedEitherWay(session.customerId, counterpart.id);

  return NextResponse.json({
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
  });
}
