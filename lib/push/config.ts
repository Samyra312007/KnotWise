export function isPushDryRun(): boolean {
  return process.env.PUSH_DRY_RUN !== "false";
}

export function isExpoPushConfigured(): boolean {
  return Boolean(process.env.EXPO_ACCESS_TOKEN) || !isPushDryRun();
}

export function expoAccessToken(): string | undefined {
  return process.env.EXPO_ACCESS_TOKEN;
}
