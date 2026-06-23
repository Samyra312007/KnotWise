import { NextResponse } from "next/server";
import { realtimeMode, pusherCluster, isPusherConfigured } from "@/lib/realtime/config";

export async function GET() {
  return NextResponse.json({
    mode: realtimeMode(),
    pusher: isPusherConfigured()
      ? {
          key: process.env.NEXT_PUBLIC_PUSHER_KEY,
          cluster: pusherCluster(),
        }
      : null,
  });
}
