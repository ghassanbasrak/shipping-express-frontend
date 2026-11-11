import { chromium, type FullConfig } from "@playwright/test";

export const authStatePath = "test-results/.auth/merchant.json";

export default async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error("Set E2E_EMAIL and E2E_PASSWORD to run the e2e tests.");
  }
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ baseURL });
  try {
    await page.goto("/sign-in");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes("sign-in"), { timeout: 60_000 });
    await page.waitForFunction(() => !!window.localStorage.getItem("jwt_access_token"), null, {
      timeout: 30_000,
    });
    await page.context().storageState({ path: authStatePath });
  } finally {
    await browser.close();
  }
}
