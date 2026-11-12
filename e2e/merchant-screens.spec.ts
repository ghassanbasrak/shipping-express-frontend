import { expect, test } from "@playwright/test";
import { authStatePath } from "./global-setup";
import { collectApiCalls } from "./helpers/api-failures";

test.use({ storageState: authStatePath });

// Merchant-accessible screens; nav URLs use "all" for owner/carrier segments.
// `endpoint` is the screen's own data call, asserted so a pass can't be vacuous.
const screens: { route: string; endpoint: string }[] = [
  { route: "/home", endpoint: "GET /v1/shipments" },
  { route: "/shipments/all/all", endpoint: "GET /v1/shipments" },
  { route: "/shipping-price-calculator", endpoint: "GET /v1/countries" },
  { route: "/cancel-shipment-requests/all", endpoint: "GET /v1/requests" },
  { route: "/topup-requests/all", endpoint: "GET /v1/payments" },
  { route: "/bank-transfers/all", endpoint: "GET /v1/requests" },
  { route: "/withdraw-requests/all", endpoint: "GET /v1/requests" },
  { route: "/merchant-dues/all/all", endpoint: "GET /v1/shipments/shipment-cods/summary" },
  { route: "/transactions/all/wallet", endpoint: "GET /v1/transactions" },
  { route: "/transactions/all/cod", endpoint: "GET /v1/transactions" },
  { route: "/transaction-reports/all", endpoint: "GET /v1/transactions" },
  { route: "/shipment-users/all", endpoint: "GET /v1/shipping-users" },
  { route: "/profile", endpoint: "GET /v1/users/me" },
  { route: "/storage", endpoint: "GET /v1/storage/plans" },
  // These storage lists only query their data once the merchant has an active
  // subscription; with none (subscriptions/current -> 204) only the gate call
  // fires, so just that call is asserted for them.
  { route: "/storage/products", endpoint: "GET /v1/storage/subscriptions/current" },
  { route: "/storage/supply-requests", endpoint: "GET /v1/storage/subscriptions/current" },
  { route: "/storage/warehouses", endpoint: "GET /v1/storage/subscriptions/current" },
];

for (const { route, endpoint } of screens) {
  test(`merchant screen ${route} loads from the live API`, async ({ page }) => {
    const calls = collectApiCalls(page);

    await page.goto(route);

    // Not bounced to sign-in/home by the route guard, and the layout rendered.
    await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, "\\/")}(\\?.*)?$`), {
      timeout: 30_000,
    });
    const main = page.locator("#fuse-main");
    await expect(main).toBeVisible({ timeout: 30_000 });

    // The screen's own data call happened and succeeded.
    await expect.poll(() => calls.seen, { timeout: 30_000 }).toContain(endpoint);
    await page.waitForLoadState("networkidle", { timeout: 30_000 });

    await expect(
      main.locator(".MuiAlert-standardError, .MuiAlert-filledError, .MuiAlert-outlinedError"),
    ).toHaveCount(0);
    expect(calls.failures, `failed API requests on ${route}`).toEqual([]);
  });
}
