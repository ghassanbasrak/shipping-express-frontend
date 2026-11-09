# Storage integration

**Current contract and ownership update, 2026-11-08:** backend changes belong to
the owning team. Do not modify that repository or assume discarded local edits are
deployed. The authoritative requirements are in the
[updated backend report](backend-modifications-report.ar.md).

The frontend automatically calls `POST v1/shipments/review/companies` after valid
details, without `shippingCompanyId`, `quoteId` or an owner override. One response
contains `suitableCompanies` with `shippingCompany/calculation/quoteId` and
`unsuitableCompanies` with `shippingCompany/reasons[{code,message}]`. A live test
confirmed this existing endpoint returns a real quote ID (SMSA total 24 for that
test address) and unavailable carriers with coverage reasons. The earlier demand
to add quote IDs to the single-carrier `/review` endpoint is superseded.

For multiple receivers, comparison runs once per pending receiver. Only carriers
available to all pending receivers can be selected; their totals are aggregated.
Switching carriers uses the existing offers. Submission reuses the same canonical,
carrier-neutral request plus the selected `shippingCompanyId/quoteId`. Backend
`providerInput` owns carrier-specific geographic names. Saved contact IDs require
a renewed companies response with the same selected carrier and reviewed total.

Warehouse pickup persistence and authoritative warehouse/product resolution must
be implemented inside this existing companies-review flow by the backend team.
No new comparison endpoint, standalone comparison feature, live booking or charge
is claimed. Pricing evidence: `test-results/carrier-review-live/api-audit.json`.

The frontend now uses the existing backend in
`C:\Users\MAJD\Desktop\Node.Js Projects\shipping-express-backend`,
branch `develop`, inspected at `175f3c3`. The earlier provisional API contract
has been replaced. Local fixture checks are supplemented by the authorized
development API audit below. No paid gateway transaction or carrier booking was
performed.

## Structure and access

`src/app/main/storage-app` owns the entity interfaces, editable models, Zod
schemas, simple RTK Query API, JavaScript list slice and English/Arabic screens.
Warehouse, plan and supply detail pages own their FormProvider and separate
basic-information tabs. Lists own their queries and local filtering/pagination.

- Administrators manage warehouses, plans and supply decisions. The backend has
  no storage employee permission mapping; no new staff grant is submitted.
- Merchants browse plans, pay for a subscription, create supply requests and view
  their own stock. Current-account cache keys do not become owner overrides.
- Product/supply menu links and direct-route access require an active owner-matched
  subscription. A transient read failure retains an already open supply draft,
  and submission requires fresh successful entitlement/warehouse reads.
- `VITE_STORAGE_API_ENABLED` defaults to enabled. Set it to `false` when targeting
  a backend without these routes. Demo mode is always enabled locally.
- Storage inventory is separate from the retired product-commerce features.

## Actual endpoints

URLs are relative to the configured API base URL. List responses are raw arrays;
the UI searches, filters and paginates them locally.

| Method | Path | Use |
| --- | --- | --- |
| GET | `v1/warehouses/admin` | Administrator warehouse list and selected edit record |
| GET | `v1/warehouses` | Subscribed merchant warehouse list |
| POST / PATCH | `v1/warehouses[/id]` | Define / edit a warehouse |
| GET | `v1/storage/plans/admin` | All administrator plans |
| GET | `v1/storage/plans` | Available merchant plans |
| GET | `v1/storage/plans/:id` | Plan detail / fresh checkout confirmation |
| POST / PATCH | `v1/storage/plans[/id]` | Define / edit a plan |
| GET | `v1/storage/subscriptions/current` | Current subscription with populated plan; deployed API returns 204 when absent |
| POST | `v1/storage/subscriptions/checkout` | Create the subscription payment |
| POST | `v1/payments/:paymentId/check-status` | Server verification of the Moyasar transaction |
| GET | `v1/storage/supply-requests/admin` | Administrator requests with merchant and warehouse |
| GET / POST | `v1/storage/supply-requests` | Own request list / create pending supply |
| PATCH | `v1/storage/supply-requests/admin/:id/status` | Approve, receive or reject |
| GET | `v1/storage/products?warehouseId=...` | Positive available stock for the current merchant |
| POST | `v1/shipments/review/companies` | All suitable carrier prices/quote IDs and unsuitable carrier reasons |
| POST | `v1/shipments` | Queue the reviewed shipment with native warehouse product IDs |

There are no frontend calls to invented storage-type, stock-availability,
individual stock-product or individual supply-detail endpoints. Supply details
are selected from the appropriate complete list. The backend has no administrator
inventory endpoint, so the new administrator workspace exposes supply history and
decisions; the product catalog is merchant-only.

## Persisted fields

- Warehouse: `name, address, mapAddress?, information?, pickup?`. Address is text.
  Map address accepts a map link or a location searched on a map. Unsafe URL
  schemes are not rendered as links. The 2026-11-08 local backend extension adds
  `pickup: {phone, email?, countryId, stateId, cityId, street, nationalAddress,
  zipCode?}`. Phone uses dial-code + hyphen + national number. Admin forms require
  complete pickup details; legacy records may omit them and remain usable for
  storage/supplies, but cannot dispatch shipments until an administrator completes
  them. The backend validates the canonical country/state/city relationship.
- Plan: `name, price, discountPrice?, durationDays, features[], isActive`.
  Each exact feature string is an allowed storage type. One line in the editor
  becomes one feature; there is no separate type catalog or type ID.
  Zero discount is retained. Clearing a discount sends the original price,
  because the backend partial PATCH cannot unset the field with null.
- Subscription: `userId, planId, paymentId, status, price, startsAt, endsAt`,
  with `plan` populated on the current-subscription read. Capabilities come
  from the current populated plan rather than an invented frozen snapshot.
- Supply: `warehouseId, products[]`; each product contains
  `name, sku?, quantity, notes?, unitPrice, storageType`.
  Ownership and pending status are server-assigned. There are no request-level
  notes, review notes, version fields or idempotency keys in these writes.
- Status PATCH: `{status}` only. The UI refreshes the request before deciding.
  Pending permits approval/rejection; approved permits receipt/rejection.
  Received and rejected requests have no further decision controls.
- Inventory: `id, userId, warehouseId, name, sku?, quantity, storageType, unitPrice`.
  The backend exposes positive available quantity, with no separate reserved or
  physical-on-hand fields. Receipt upserts by owner, warehouse, storage type and
  exact SKU when supplied, otherwise exact name. No case folding is introduced.

## Payment

Checkout sends `{planId}` and receives `{payment, checkout, subscription?}`.
The server supplies the base amount, tax, total, public key, currency and callback
URL. The UI displays the returned total before card entry and loads the pinned
[Moyasar Form 2.3.0 integration](https://docs.moyasar.com/getting-started/your-first-payment).
Secret keys never belong in the frontend.

Paid plans activate only after server verification using
`{moyasarPaymentId}`; no wallet debit or client-only activation is performed.
A zero-price plan returns `checkout:null` and activates server-side. The current
subscription is then checked again. Payment verification and entitlement refresh
have independent retry paths, preserving the checkout in account-scoped session
storage. The callback observes the fulfilled entitlement query rather than a
possibly stale lazy-query result from the pre-payment navigation read.

The frontend handles `/storage/payment-result?paymentId=...&id=...` and the
backend example callback path `/wallet/payment-result`. The backend's
`MOYASAR_CALLBACK_URL` must point to the deployed frontend callback. Its public/
secret gateway keys must already be configured. No environment secret or backend
callback configuration was changed by this work.

Demo mode uses a clearly labelled local payment simulation. It does not load
Moyasar or charge a card.

## Shipment integration and backend compatibility fix

Warehouse items are serialized for every pending receiver as:

```json
{
  "quoteId": "server-issued-quote-id",
  "warehouseId": "dispatch-warehouse-id",
  "products": [
    {"title": "Product", "price": 9, "quantity": 2, "warehouseProductId": "stock-id"}
  ]
}
```

Quantity is per receiver. Before review and submission the UI reads fresh current
subscription and inventory, checks ownership/warehouse and aggregates quantity
across pending receivers. The backend remains responsible for atomic stock
deduction when the queued shipment is processed. A 201 message is asynchronous
acceptance, not a reason to resubmit.

Current backend requirements: retain `warehouseId` and product IDs through
comparison/create validation, resolve the authoritative warehouse sender/products
inside each company review, and preserve the original canonical request separately
from carrier-specific provider input. Quote persistence already exists in the
companies endpoint; do not reapply the obsolete single-review quote fix.

The existing single-use, account/carrier-bound backend quote checks remain
unchanged. Newly saved sender/receiver contact IDs change that fingerprint, so
the frontend renews the quote after contact saves and compares its total with the
reviewed total before queueing. A changed price requires another review.
Returned contact IDs and completed receiver outcomes remain in the form.

No `storageFulfillment`, comparison screen, or new create endpoint is introduced.
As of 2026-11-08 warehouse requests include `warehouseId` alongside the existing
`products[]`. Source selection appears before route/contact details. The warehouse
name is the sender name, pickup phone/address/geographic IDs are automatic and
merchant-editable sender controls are replaced by a summary. Existing external
sender drafts survive switching sources. No warehouse sender contact is created.
Canonical geography is loaded through the existing geographic queries; carrier
mappings belong to the backend's companies-review operation.

The backend team must make companies review and queue admission resolve the
authoritative warehouse sender and product snapshots server-side. They must require an active subscription,
one warehouse, owned products, distinct IDs and valid positive available quantities;
the server must replace submitted sender/contact/title/price values. Sender changes
after review must invalidate the quote. The worker's conditional stock decrement
must check warehouseId. Shipment records must retain warehouseId. Unknown legacy warehouse
pickup data is never guessed from a map link or the merchant's address.

The commercial checkbox, its manual products editor and extra-weight consent
checkbox are removed from shipment creation, returns and calculator form contracts.
The frontend sends neither isCommercial nor acceptExtraWeightTerms. External
shipments send no products, including when a legacy draft contains them. Only
warehouse selection sends products. Historical read-only entity fields and actual
weight/fee calculations remain compatible. Returns stay external and never allocate
the original warehouse stock again.

The backend has no general storage request-key replay API. An uncertain shipment
write is therefore shown as an unknown result and excluded from automatic retry;
the user is directed to shipment history. An uncertain supply write retains its
draft and asks the user to inspect request history before another submission.
The demo does not claim unsupported idempotency or cancellation restocking.

## Verification

- `npm run typecheck:app`
- `npm run build -- --outDir build/storage-production`
- `npm run build:demo -- --outDir build/storage-demo`
- `npm run test:storage`
- `npm run test:storage:backend`
- `npm run test:storage:browser`
- Existing shipment/contact/COD/authentication/retirement/navigation and demo suites.

The backend test scripts accept `STORAGE_BACKEND_DIR`. They execute the real
storage/shipment Zod declarations with shared database/environment primitives
isolated, and the actual native companies-review operation/controller and queue with isolated
pricing, repositories, locking and queue dependencies. Browser checks use local
demo/fixture APIs. Reports are in `test-results/storage` and
`test-results/storage-browser`; they establish frontend/contract behavior rather
than live gateway, database, Redis or carrier acceptance. Backend dependencies
are absent from this checkout, so a full backend dependency build was not run.
An attempted `npm ci --ignore-scripts` was rejected because the backend lockfile
and manifest have incompatible transitive dependency versions; the lockfile was
not rewritten as part of this audit.

## Historical development API audit — 2026-11-07

The `/review` observations below describe the old frontend endpoint. They do not
apply to the active `/review/companies` flow verified above. No single-review
compatibility patch is required for the current frontend.

The user supplied `https://api.v1.dev.e5hh6.ashamcoexpress.com` and authorized
administrator/merchant test accounts. Credentials and tokens were kept in process
memory and excluded from reports. Only sessions created by this audit were revoked.
Normal frontend builds, the example environment and fallback now target this API;
explicit environment overrides still take precedence.

| Requirement | Observed result |
| --- | --- |
| Warehouse name, address, map and information | Created successfully, then returned by the subscribed merchant list |
| Plan price, discounted price and storage types | Created at price 25 with discountPrice 0 and three allowed types |
| Subscription activation | Free checkout returned a successful zero-value payment and active one-day subscription; the next read populated the plan |
| Access control | Inventory returned 403 before subscription; merchant access to administrator warehouses returned 403 |
| Supply products and allowed types | Two-product request returned pending; a type outside the plan returned 403 |
| Administrator review/contact | List populated the merchant contact and warehouse; approval returned approved |
| Physical receipt | Pending-to-received returned 400; approved-to-received added stock; a repeated receipt returned 400 |
| Matching products | A second receipt increased the same SKU from 10 to 13 and the same no-SKU name from 4 to 6, retaining both product IDs |
| Warehouse shipment review | The deployed endpoint returned total 24 but **no quoteId**; final creation cannot be verified against this deployment |

The then-proposed local single-review fix was not deployed and is no longer
required by this frontend. The subsequent native companies-review test supersedes
that pricing blocker. Warehouse pickup and atomic execution remain backend-team
work; no wallet funding, carrier booking, queued stock allocation or paid Moyasar
confirmation was performed.

Test records remain clearly named `فحص التخزين 2026-11-07` and
`باقة فحص التخزين 2026-11-07`: warehouse `6aef63e2fe4f4b824918c35c`,
plan `6aef63e2fe4f4b824918c362`, two received supplies
`6aef647bfe4f4b824918c395` and `6aef64ecfe4f4b824918c409`.
The free subscription ends on 2026-11-08 at 17:47:42 UTC. These are development
test records, not physical stock confirmation. Status/request evidence is saved
locally in `test-results/storage-live/api-audit.json`; the requirement observations
are recorded in `migration-status.json`. Local browser checks remain fixture
checks: all 19 passed, including warehouse selection, native product IDs, quantities,
review and creation, plus Arabic mobile layouts and payment-widget recovery.

## Automatic warehouse sender update — 2026-11-08

Frontend implemented; backend implementation is handed to its owning team under
the ownership update above. Deploy the compatible backend and frontend together,
then complete pickup details for existing warehouses in the
administrator editor. No database backfill invents contacts or geography.

Validation: active application typecheck and production/demo builds passed;
35 shipment regression checks, 27 storage checks, six native backend schema
payloads and 12 real-source backend checks with isolated infrastructure passed.
Browser fixtures passed 33 shipment and 21 storage checks, including source-first
placement, automatic sender, no warehouse sender contact creation, source-switch
draft/quantity preservation and absence of the removed options. Both browser
reports contain zero uncaught exceptions. These are local checks; this update
was not deployed or exercised through a live carrier or paid gateway.

The authoritative current inventory and remaining deployment checks are in
`migration-status.json` under `carrierReviewUpdate`. The development API audit
above records the previous day's deployed contract and is retained as history.
