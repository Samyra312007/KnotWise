import { requireApiClientSession } from "@/lib/auth/api";
import { NextResponse } from "next/server";
import { threadRedisChannel } from "@/lib/realtime/channels";
import { createRedisSubscriber, subscribeMemory } from "@/lib/realtime/redis";
import { isRedisConfigured } from "@/lib/realtime/config";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const thread = await prisma.thread.findUnique({
    where: { customerId: session.customerId },
  });
  if (!thread) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Thread not found." } }, { status: 404 });
  }

  const channel = threadRedisChannel(thread.id);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (payload: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send({ type: "connected", threadId: thread.id });

      let cleanup: (() => void) | undefined;

      if (isRedisConfigured()) {
        const sub = createRedisSubscriber();
        if (sub) {
          void sub.connect().then(() => sub.subscribe(channel));
          sub.on("message", (_ch, message) => {
            try {
              send(JSON.parse(message) as unknown);
            } catch {
              return;
            }
          });
          cleanup = () => {
            void sub.unsubscribe(channel);
            void sub.quit();
          };
        }
      } else {
        cleanup = subscribeMemory(channel, send);
      }

      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": ping\n\n"));
      }, 15000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(heartbeat);
        cleanup?.();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
