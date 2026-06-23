import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { listConversationMessages, sendConversationMessage } from "@/lib/c2c/messages";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  const cursor = new URL(req.url).searchParams.get("cursor") ?? undefined;

  try {
    const result = await listConversationMessages({
      conversationId: id,
      customerId: session.customerId,
      cursor,
    });

    return NextResponse.json({
      messages: result.messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        mine: m.senderId === session.customerId,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt?.toISOString() ?? null,
      })),
      nextCursor: result.nextCursor,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Conversation not found." } }, { status: 404 });
    }
    throw err;
  }
}

const sendSchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = sendSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid message." } }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  try {
    const message = await sendConversationMessage({
      conversationId: id,
      customerId: session.customerId,
      orgId: customer.orgId,
      clientId: session.clientId,
      body: parsed.body,
    });

    return NextResponse.json({
      message: {
        id: message.id,
        body: message.body,
        senderId: message.senderId,
        mine: true,
        createdAt: message.createdAt.toISOString(),
        readAt: null,
      },
    });
  } catch (err) {
    if (!(err instanceof Error)) throw err;
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Conversation not found." } }, { status: 404 });
    }
    if (err.message === "BLOCKED") {
      return NextResponse.json(
        { error: { code: "BLOCKED", message: "You cannot message this person." } },
        { status: 403 }
      );
    }
    if (err.message === "TOO_LONG") {
      return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Message too long." } }, { status: 400 });
    }
    throw err;
  }
}
