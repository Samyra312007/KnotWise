import { describe, expect, it } from "vitest";
import { hashCustomerRef } from "@/lib/analytics/track";
import { ANALYTICS_EVENTS } from "@/lib/analytics/taxonomy";
import { escapeCsvCell, parseCsvLine } from "@/lib/crm/csv";

describe("analytics taxonomy", () => {
  it("defines core product events", () => {
    expect(ANALYTICS_EVENTS.SIGNUP_COMPLETED).toBe("client.signup_completed");
    expect(ANALYTICS_EVENTS.MUTUAL_CREATED).toBe("mutual.created");
    expect(ANALYTICS_EVENTS.C2C_MESSAGE_SENT).toBe("c2c.message_sent");
  });

  it("hashes customer ids without exposing raw values", () => {
    const hash = hashCustomerRef("cust_test_123");
    expect(hash).toHaveLength(16);
    expect(hash).not.toContain("cust_test");
  });
});

describe("csv helpers", () => {
  it("escapes commas and quotes", () => {
    expect(escapeCsvCell('Hello, "world"')).toBe('"Hello, ""world"""');
  });

  it("parses quoted csv lines", () => {
    const cells = parseCsvLine('Aanya,Sharma,female,"Chennai, TN"');
    expect(cells).toEqual(["Aanya", "Sharma", "female", "Chennai, TN"]);
  });
});
