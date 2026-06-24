import { randomUUID } from "node:crypto";
import { dailyApiKey, isVideoConfigured, isVideoDryRun } from "./config";

export type VideoRoom = {
  roomId: string;
  url: string;
  provider: "daily" | "dry_run";
};

export async function createVideoRoom(input: { eventId: string; expiresAt: Date }): Promise<VideoRoom> {
  if (!isVideoConfigured()) throw new Error("NOT_CONFIGURED");

  if (isVideoDryRun()) {
    const roomId = `dry-${input.eventId.slice(0, 8)}`;
    return {
      roomId,
      url: `https://knotwise.daily.co/${roomId}`,
      provider: "dry_run",
    };
  }

  const key = dailyApiKey();
  if (!key) throw new Error("NOT_CONFIGURED");

  const roomName = `kw-${input.eventId.slice(0, 12)}-${randomUUID().slice(0, 6)}`;
  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        exp: Math.floor(input.expiresAt.getTime() / 1000) + 3600,
        enable_chat: true,
        enable_screenshare: true,
      },
    }),
  });

  if (!res.ok) throw new Error("VIDEO_CREATE_FAILED");

  const data = (await res.json()) as { name: string; url: string };
  return {
    roomId: data.name,
    url: data.url,
    provider: "daily",
  };
}
