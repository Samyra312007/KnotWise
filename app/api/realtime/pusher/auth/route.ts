import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import { getPusherServer } from "@/lib/realtime/pusher-server";
import { parseC2cChannelName, parseThreadChannelName } from "@/lib/realtime/channels";
import { getConversationForCustomer } from "@/lib/c2c/conversations";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const pusher = getPusherServer();
  if (!pusher) {
    return NextResponse.json({ error: { code: "UNAVAILABLE", message: "Realtime not configured." } }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const body = form
    ? {
        socket_id: String(form.get("socket_id") ?? ""),
        channel_name: String(form.get("channel_name") ?? ""),
      }
    : await req.json().catch(() => null);

  const socketId = body?.socket_id;
  const channelName = body?.channel_name;
  if (!socketId || !channelName) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Missing socket auth." } }, { status: 400 });
  }

  const c2cId = parseC2cChannelName(channelName);
  if (c2cId) {
    const conversation = await getConversationForCustomer(c2cId, session.customerId);
    if (!conversation) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not allowed." } }, { status: 403 });
    }
    const auth = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(auth);
  }

  const threadId = parseThreadChannelName(channelName);
  if (threadId) {
    const thread = await prisma.thread.findFirst({
      where: { id: threadId, customerId: session.customerId },
    });
    if (!thread) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not allowed." } }, { status: 403 });
    }
    const auth = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(auth);
  }

  return NextResponse.json({ error: { code: "FORBIDDEN", message: "Unknown channel." } }, { status: 403 });
}
