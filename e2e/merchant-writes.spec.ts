import { expect, test, type Page } from "@playwright/test";
import { authStatePath } from "./global-setup";

test.use({ storageState: authStatePath });

const prefix = "e2e-contact";

const cards = (page: Page) => page.getByTestId(/^shipment-user-[0-9a-f]+$/);

async function findContact(page: Page, name: string) {
  await page.goto("/shipment-users/all");
  await page.getByTestId("shipment-users-search").fill(name);
  return cards(page).filter({ hasText: name });
}

// Confirms the removal dialog and waits for the backend DELETE to finish, so a
// following navigation cannot cancel the request.
async function confirmRemoval(page: Page) {
  const deleted = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" && response.url().includes("/v1/shipping-users/"),
    { timeout: 30_000 },
  );
  await page.getByRole("dialog").locator("button.MuiButton-contained").click();
  expect((await deleted).status()).toBeLessThan(300);
}

// Removes any contact a failed run left behind, through the same UI the test uses.
test.afterEach(async ({ page }) => {
  await page.goto("/shipment-users/all");
  await page.getByTestId("shipment-users-search").fill(prefix);
  await page.waitForLoadState("networkidle");
  for (let guard = 0; guard < 10; guard++) {
    const leftover = cards(page).filter({ hasText: prefix });
    if ((await leftover.count()) === 0) break;
    await leftover.first().getByTestId(/^remove-shipment-user-/).click();
    await confirmRemoval(page);
    await page.reload();
    await page.getByTestId("shipment-users-search").fill(prefix);
    await page.waitForLoadState("networkidle");
  }
});

test("merchant creates, edits and removes a saved contact", async ({ page }) => {
  const name = `${prefix}-${Date.now()}`;
  const edited = `${name}-edited`;

  // Navigate + act: create
  await page.goto("/shipment-users/all");
  await page.getByTestId("add-shipment-user").click();
  const editor = page.getByTestId("shipment-user-editor");
  await expect(editor).toBeVisible({ timeout: 30_000 });
  await editor.locator('input[name="fullName"]').fill(name);
  await editor.locator('input[name="phone"]').fill("+966500000123");
  // Country defaults to Saudi Arabia; the state is required. A city is chosen too:
  // the live API rejects an empty cityId (422 E_INVALID_BODY on address.cityId),
  // so a city-less save is a known failure reported separately, not exercised here.
  await editor.locator('input[name="address.stateId"]').click();
  await page.getByRole("option").first().click();
  await editor.locator('input[name="address.cityId"]').click();
  await page.getByRole("option").first().click();
  await page.getByTestId("save-shipment-user").click();

  // Assert: the new contact is in the list (returned to the list after save)
  await expect(page).toHaveURL(/\/shipment-users\/all$/, { timeout: 30_000 });
  await expect(await findContact(page, name)).toHaveCount(1, { timeout: 30_000 });

  // Act: edit the name
  await (await findContact(page, name)).getByRole("link").click();
  await expect(page.getByTestId("shipment-user-editor")).toBeVisible({ timeout: 30_000 });
  await page.locator('input[name="fullName"]').fill(edited);
  await page.getByTestId("save-shipment-user").click();

  // Assert: the list shows the new name, not the old one
  await expect(page).toHaveURL(/\/shipment-users\/all$/, { timeout: 30_000 });
  await expect(await findContact(page, edited)).toHaveCount(1, { timeout: 30_000 });

  // Act: remove (with confirmation)
  await (await findContact(page, edited)).getByTestId(/^remove-shipment-user-/).click();
  await confirmRemoval(page);

  // Assert: contact is gone
  await expect(await findContact(page, prefix)).toHaveCount(0, { timeout: 30_000 });
});

// Authenticated pricing request only: no wallet debit, no shipment, no carrier booking.
test("merchant gets live carrier prices from the shipping calculator", async ({ page }) => {
  await page.goto("/shipping-price-calculator");
  await expect(page.getByTestId("shipping-type-local")).toBeVisible({ timeout: 30_000 });

  // The dev data is messy: only some routes have carrier coverage. A same-city local
  // route in Tabuk / Neom is priceable (found by scanning live reviews); the label
  // pattern covers the English and Arabic names.
  for (const side of ["sender", "receiver"]) {
    await page.locator(`input[name="${side}StateId"]`).click();
    await page.getByRole("option", { name: /^(Tabuk|تبوك)$/ }).click();
    await page.locator(`input[name="${side}CityId"]`).click();
    await page.getByRole("option", { name: /Neom|نيوم/i }).first().click();
    await page.locator(`input[name="${side}Street"]`).fill("E2E Test Street 1");
    await page.locator(`input[name="${side}NationalAddress"]`).fill("RAGI2929");
  }
  await page.getByTestId("submit-shipment-details").click();

  const results = page.getByTestId("carrier-comparison-results");
  await expect(results).toBeVisible({ timeout: 60_000 });
  await expect(results.getByTestId(/^carrier-price-/).first()).toBeVisible({ timeout: 60_000 });
});
