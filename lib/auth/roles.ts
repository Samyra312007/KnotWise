export type MembershipRole = "owner" | "ops" | "matchmaker" | "readonly";

export const ROLES: MembershipRole[] = ["owner", "ops", "matchmaker", "readonly"];

export function isOpsOrOwner(role: string): boolean {
  return role === "owner" || role === "ops";
}

export function canWriteCustomers(role: string): boolean {
  return role !== "readonly";
}

export function canManageBilling(role: string): boolean {
  return role === "owner";
}

export function canManageVerification(role: string): boolean {
  return role === "owner" || role === "ops";
}
