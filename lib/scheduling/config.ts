export function isVideoDryRun(): boolean {
  return process.env.VIDEO_DRY_RUN !== "false";
}

export function isVideoConfigured(): boolean {
  if (isVideoDryRun()) return true;
  return Boolean(process.env.DAILY_API_KEY);
}

export function dailyApiKey(): string | undefined {
  return process.env.DAILY_API_KEY;
}

export const MIN_SCHEDULE_LEAD_MS = 60 * 60 * 1000;
export const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;
export const REMINDER_WINDOW_MS = 60 * 60 * 1000;
