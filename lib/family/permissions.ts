import { APPROVER_AGE_CUTOFF, type DelegateRole } from "./constants";

export function canInviteApproverRole(clientAge: number, delegateApproverOptIn: boolean): boolean {
  return clientAge < APPROVER_AGE_CUTOFF || delegateApproverOptIn;
}

export function delegateCanApprove(
  role: DelegateRole | string,
  clientAge: number,
  delegateApproverOptIn: boolean
): boolean {
  return role === "approver" && canInviteApproverRole(clientAge, delegateApproverOptIn);
}

export function delegateCanActOnIntro(
  role: DelegateRole | string,
  clientAge: number,
  delegateApproverOptIn: boolean
): boolean {
  return delegateCanApprove(role, clientAge, delegateApproverOptIn);
}
