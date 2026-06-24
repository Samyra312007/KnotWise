export const DELETION_GRACE_DAYS = 30;
export const EXPORT_RETENTION_HOURS = 72;
export const MIN_SIGNUP_AGE = 18;
export const MAX_SIGNUP_AGE = 60;

export function deletionScheduledFor(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + DELETION_GRACE_DAYS);
  return d;
}

export function exportExpiresAt(from = new Date()): Date {
  const d = new Date(from);
  d.setHours(d.getHours() + EXPORT_RETENTION_HOURS);
  return d;
}

export function validateSignupAge(dateOfBirth: Date): string | null {
  const ageMs = Date.now() - dateOfBirth.getTime();
  const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < MIN_SIGNUP_AGE) return `You must be at least ${MIN_SIGNUP_AGE} to join.`;
  if (ageYears > MAX_SIGNUP_AGE) return `KnotWise is for profiles aged ${MIN_SIGNUP_AGE}–${MAX_SIGNUP_AGE}.`;
  return null;
}
