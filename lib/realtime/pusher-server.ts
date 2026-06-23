import Pusher from "pusher";
import { isPusherConfigured, pusherCluster } from "@/lib/realtime/config";

let server: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (!isPusherConfigured()) return null;
  if (!server) {
    server = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: pusherCluster(),
      useTLS: true,
    });
  }
  return server;
}

export async function triggerPusherEvent(channel: string, event: string, payload: unknown) {
  const pusher = getPusherServer();
  if (!pusher) return false;
  await pusher.trigger(channel, event, payload);
  return true;
}
