export const MAX_DELEGATES_PER_CLIENT = 3;
export const APPROVER_AGE_CUTOFF = 35;

export type DelegateRole = "observer" | "approver";
export type DelegateStatus = "invited" | "accepted" | "revoked";

export const DELEGATE_ROLES: DelegateRole[] = ["observer", "approver"];
