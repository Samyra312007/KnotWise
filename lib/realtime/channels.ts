export function c2cChannelName(conversationId: string): string {
  return `private-c2c-${conversationId}`;
}

export function c2cRedisChannel(conversationId: string): string {
  return `c2c:conversation:${conversationId}`;
}

export function threadRedisChannel(threadId: string): string {
  return `thread:${threadId}`;
}

export function threadChannelName(threadId: string): string {
  return `private-thread-${threadId}`;
}

export function parseC2cChannelName(channel: string): string | null {
  const prefix = "private-c2c-";
  if (!channel.startsWith(prefix)) return null;
  return channel.slice(prefix.length);
}

export function parseThreadChannelName(channel: string): string | null {
  const prefix = "private-thread-";
  if (!channel.startsWith(prefix)) return null;
  return channel.slice(prefix.length);
}
