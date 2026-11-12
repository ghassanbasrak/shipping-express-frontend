import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test("merchant signs in and reaches their shipments list", async ({ page }) => {
  if (!email || !password) {
    throw new Error("Set E2E_EMAIL and E2E_PASSWORD to run this test.");
  }

  // Navigate
  await page.goto("/sign-in");
  await expect(page.locator('input[name="email"]')).toBeVisible();

  // Act
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  // Assert login (real backend latency)
  await expect(page).not.toHaveURL(/sign-in/, { timeout: 30_000 });
  await expect(page.locator('input[name="password"]')).toHaveCount(0);

  // Act
  await page.goto("/shipments/all/all");

  // Assert outcome: the route is allowed for this account (not bounced to
  // home) and the shipments grid rendered after authenticated data loaded.
  await expect(page).toHaveURL(/\/shipments\/all\/all/);
  await expect(page.getByRole("grid")).toBeVisible({ timeout: 30_000 });
});
