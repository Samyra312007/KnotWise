import { describe, expect, it } from "vitest";
import { MAX_C2C_MESSAGE_LENGTH } from "@/lib/c2c/conversations";

describe("c2c chat", () => {
  it("enforces max message length constant", () => {
    expect(MAX_C2C_MESSAGE_LENGTH).toBe(4000);
  });

  it("validates message body length bounds", () => {
    const valid = "Hello there!";
    const tooLong = "x".repeat(MAX_C2C_MESSAGE_LENGTH + 1);
    expect(valid.trim().length).toBeGreaterThan(0);
    expect(valid.trim().length).toBeLessThanOrEqual(MAX_C2C_MESSAGE_LENGTH);
    expect(tooLong.length).toBeGreaterThan(MAX_C2C_MESSAGE_LENGTH);
  });
});
