# Ashamco Express frontend

Install dependencies with `npm ci`, then run `npm run dev:demo` and open
http://localhost:3000. Demo mode signs in as a local admin and provides sample
data for all feature pages currently present in this checkout, including shipments,
finance, merchants, affiliates, dashboard summaries and geographic settings.
Changes are saved in this browser until you choose **Reset demo data** on Home
or in the user menu. Carrier logo and icon uploads are stored locally in demo
mode and are limited to 1 MB each. Use the user menu to switch between the
admin, merchant, and affiliate demo accounts; switching keeps demo data and
reloads the page with the selected account's permissions.

`npm run dev` keeps the existing backend connection. Set `VITE_BASE_URL` in a
local `.env` file when that backend is available. Demo mode never forwards API
requests to the backend.

## Sidebar navigation

The sidebar uses persistent `group` headings with direct page links. Only two
closely related sets use an expandable `collapse` submenu:

- **Overview:** Home.
- **Shipping:** Shipments, price calculator, senders/receivers, cancellation requests.
- **Payments & Finance:** Top-up, bank transfer, withdrawal and COD dues pages,
  plus the **Transactions** submenu (wallet, COD, transaction reports).
- **Accounts & Approvals:** Merchants, affiliates and account pages.
- **Reports & Marketing:** Merchant statistics, coupons, alerts.
- **Shipping Settings:** Shipping companies, payment plans, plus the
  **Locations** submenu (countries, states, cities).
- **Administration:** Staff, applications, logs.

Headings and submenu labels support English and Arabic. Existing role and
feature permissions still control each page; empty submenus and their headings
are hidden recursively. Submenus open automatically for the current page and
can also be toggled with the keyboard.

Run `node scripts/navigation-regression.cjs` to check grouping, translations,
and role/feature visibility.

Verification review pages are removed. Merchant account verification remains in
`/verify-account`, including its onboarding document submission.

## Excluded store functionality

Store authentication, store integration and new-store pages have been removed,
including their routes, navigation, home shortcuts, platform assets and
merchant store-status fields/filters. Old URLs resolve to the standard 404 page.
No storefront, store integration, product-commerce, shopping-cart or order
management implementation is included; unused e-commerce template mocks were
also removed. Redux stores remain for application state management. Existing
packaging fixtures and links are unchanged; this checkout does not currently
contain a packaging page/route implementation.

Run `node scripts/store-removal-regression.cjs` to verify these exclusions.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev:demo` | Start the local demo on port 3000, without a backend |
| `npm run dev` | Start Vite with the configured backend |
| `npm run build:demo` | Build the demo configuration |
| `npm run build` | Build the backend configuration |
| `npm run typecheck:app` | Check the active application types |
| `npm run test:demo` | Check demo data contracts and generated report files |
| `npm run test:demo:browser` | Smoke-check the demo build in Chromium (set `BROWSER_PATH` if needed) |

The demo covers all currently available sidebar pages. Lists, filters, detail
pages, active edits and request decisions use local sample records. Merchant
and affiliate submission flows are available under their demo accounts.
Transaction reports generate local PDF and Excel files from the selected
filters. Shipment labels and invoices are local sample PDFs. Shipment creation,
tracking, cancellation, weight adjustments, COD settlements, withdrawals,
subscriptions, merchant edits and affiliate activity use linked local records.

Top-up checkout stays inside the demo app and simulates payment confirmation;
it never contacts a payment gateway. Successful confirmations credit the wallet
once, including when revisiting the callback. COD-to-wallet transfers retain the
inclusive 15% tax calculation. Demo quotes are illustrative, not live carrier rates.

Existing browser-saved edits are retained when missing demo collections are added.
Account switching also retains those records and saved balances. Use **Reset demo
data** to start again. Normal `dev` and `build` commands keep the configured live
backend behavior by default. `VITE_DEMO_MODE=true` enables the demo adapter;
`dev:demo` and `build:demo` set that flag for you.
Authentication is bypassed with the three demo identities. Removed features stay
removed, and the absent packaging page is not restored by this demo update.

Run `npm run test:demo` for the existing and extended demo contract checks. For a
separate build, run `npm run build:demo -- --outDir .demo-complete-work/build`, then
set `DEMO_BUILD_DIR=.demo-complete-work/build` when running `npm run test:demo:browser`.
The browser check covers current feature routes, all three identities, local
checkout/replay, Arabic mobile pages and absence of backend network requests.
