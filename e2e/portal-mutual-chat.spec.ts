import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";

type E2EState = {
  tokenA: string;
  tokenB: string;
  suggestionAId: string;
  suggestionBId: string;
};

function loadState(): E2EState {
  const raw = fs.readFileSync(path.join(__dirname, ".e2e-state.json"), "utf8");
  return JSON.parse(raw) as E2EState;
}

test.describe("portal mutual to chat", () => {
  test("both clients accept intro and chat link appears", async ({ browser }) => {
    if (!process.env.DATABASE_URL) {
      test.skip(true, "DATABASE_URL required");
      return;
    }

    let state: E2EState & { skipped?: boolean };
    try {
      state = loadState();
    } catch {
      test.skip(true, "Run global setup first (requires DB)");
      return;
    }

    if (state.skipped) {
      test.skip(true, "Database unavailable for E2E");
      return;
    }

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto(`/portal/verify?token=${state.tokenA}`);
    await pageA.waitForURL(/\/portal(\/onboarding)?/, { timeout: 15_000 });

    await pageB.goto(`/portal/verify?token=${state.tokenB}`);
    await pageB.waitForURL(/\/portal(\/onboarding)?/, { timeout: 15_000 });

    await pageA.goto(`/portal/matches/${state.suggestionAId}`);
    await pageA.getByRole("button", { name: "Accept intro" }).click();
    await expect(pageA.getByText(/interested|accepted|waiting/i)).toBeVisible({ timeout: 10_000 });

    await pageB.goto(`/portal/matches/${state.suggestionBId}`);
    await pageB.getByRole("button", { name: "Accept intro" }).click();
    await expect(pageB.getByText(/mutual match/i)).toBeVisible({ timeout: 10_000 });
    await expect(pageB.getByRole("link", { name: "Open chat" })).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });
});
