# Ashamco Express frontend

Install dependencies with `npm ci`, then run `npm run dev:demo` and open
http://localhost:3000. Demo mode signs in as a local admin and provides sample
shipping companies, countries, carrier naming mappings, and state previews.
Changes are saved in this browser until you choose **Reset demo data** on Home
or in the user menu. Carrier logo and icon uploads are stored locally in demo
mode and are limited to 1 MB each. Use the user menu to switch between the
admin, merchant, and affiliate demo accounts; switching keeps demo data and
reloads the page with the selected account's permissions.

`npm run dev` keeps the existing backend connection. Set `VITE_BASE_URL` in a
local `.env` file when that backend is available. Demo mode never forwards API
requests to the backend.

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

The demo covers all currently migrated sidebar pages. Lists, filters, detail
pages, active edits and request decisions use local sample records. Merchant
and affiliate submission flows are available under their demo accounts.
Transaction reports generate local PDF and Excel files from the selected
filters. Pending migration features remain unavailable.
