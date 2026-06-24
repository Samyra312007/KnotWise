import { describe, expect, it } from "vitest";
import {
  canInviteApproverRole,
  delegateCanActOnIntro,
  delegateCanApprove,
} from "@/lib/family/permissions";
import { revealLevelForDelegate } from "@/lib/family/reveal";
import { MAX_DELEGATES_PER_CLIENT, APPROVER_AGE_CUTOFF } from "@/lib/family/constants";

describe("family delegate permissions", () => {
  it("allows approver for clients under age cutoff", () => {
    expect(canInviteApproverRole(APPROVER_AGE_CUTOFF - 1, false)).toBe(true);
    expect(delegateCanApprove("approver", APPROVER_AGE_CUTOFF - 1, false)).toBe(true);
    expect(delegateCanActOnIntro("approver", APPROVER_AGE_CUTOFF - 1, false)).toBe(true);
  });

  it("blocks approver for older clients without opt-in", () => {
    expect(canInviteApproverRole(APPROVER_AGE_CUTOFF, false)).toBe(false);
    expect(delegateCanApprove("approver", APPROVER_AGE_CUTOFF, false)).toBe(false);
    expect(delegateCanActOnIntro("observer", APPROVER_AGE_CUTOFF, true)).toBe(false);
  });

  it("allows approver for older clients with opt-in", () => {
    expect(canInviteApproverRole(APPROVER_AGE_CUTOFF, true)).toBe(true);
    expect(delegateCanApprove("approver", APPROVER_AGE_CUTOFF + 5, true)).toBe(true);
  });

  it("observer cannot act on intros", () => {
    expect(delegateCanActOnIntro("observer", 25, false)).toBe(false);
  });
});

describe("family delegate reveal", () => {
  it("keeps limited reveal until mutual contact share", () => {
    expect(revealLevelForDelegate("sent", null)).toBe("limited");
    expect(revealLevelForDelegate("mutual", { contactSharedAt: null })).toBe("limited");
    expect(revealLevelForDelegate("mutual", { contactSharedAt: new Date() })).toBe("full");
  });
});

describe("family delegate limits", () => {
  it("caps delegates at three", () => {
    expect(MAX_DELEGATES_PER_CLIENT).toBe(3);
  });
});
