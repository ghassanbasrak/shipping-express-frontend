# Ashamco Express migration conventions

Use `../bastaline-admin-frontend` as the reference for the new Fuse feature structure. Preserve existing Ashamco backend contracts and complete feature behavior. Reuse migrated shared components at their existing paths. Redux feature slices remain JavaScript (`*Slice.js`); pages, APIs, schemas, and entity models use TypeScript.

- An entity file such as `models/ICountry.ts` contains the root entity interface and exported interfaces for its nested domain objects (for example `IShipmentCountry`). Do not put form inputs, filters, pagination wrappers, request/response types, or unrelated entity interfaces there.
- Import reference entities from their own features. Pair reference IDs with populated fields: `countryId?: string; country?: ICountry;` and plural IDs with `countries?: ICountry[]`. Follow the backend's actual ID type. Migrate dependency entities/features before their consumers; ensure imports resolve. Do not claim a dependency feature is migrated when only its entity model exists.
- Keep `*Model.ts` focused on defaults and editable fields, following the reference. Put shared feature helpers in `Utils.ts`.
- Reuse validation helpers from `src/app/main/utils/validations.ts`. Use custom refinements such as `superRefine` for business rules. Preserve the source feature's required and optional fields.
- Follow reference `*Api.ts` structure: simple RTK Query endpoint definitions, request/response types declared in that file, and exported hooks. Avoid response normalization, generic PageResponse wrappers, transformResponse pipelines, and multi-request queryFn workflows. Keep any necessary multi-resource save orchestration in the feature's UI handlers and preserve recovery from partial saves.
- Follow reference detail pages: form methods and FormProvider in `Country.tsx`, a separate header, Tabs, and `country/tabs/BasicInfoTab.tsx`. Do not introduce a nested CountryForm component. Match reference FusePageCarded layout and header structure.
- Keep list pages such as `Countries.tsx` as simple FusePageCarded wrappers around their header and table. Put list initialization, filter selectors, queries, and pagination in the table as in the reference.
- Specify matching `flex` and `minWidth` for every table column, with `minWidth = flex * 100`. Boolean/tiny columns: 0.3/30. Codes, dates, numbers, statuses, enums: 0.5-0.7/50-70. Phone/email: 0.8-0.9/80-90. Names, notes, actions: 0.9-1.3/90-130.
- Define feature enum constants in `Utils.ts`, for example `transactionStatus = { pending: "pending", completed: "completed" }`. Export matching title and color helpers (`toTransactionStatusTitle`, `toTransactionStatusColor`) and reuse them throughout the feature. Follow the reference's translation keys and color conventions. Do not invent enums where none exist.
- Preserve unsaved form edits during background refetches and retain returned backend IDs so subsequent mapping saves update the same record.
- Salla, Odoo, product e-commerce, and comparison features have been removed. Keep packaging requests.

Validate affected behavior and run the active application typecheck/build. Full-source checks may include pre-existing unused template/shared-component issues; report their scope accurately.

Migration progress: foundation/authentication, countries-app, and shipping-companies-app are migrated. Shipping companies is an independent root entity used by the geographic naming mappings. Continue with states-app, then cities-app, before features that reference those entities. Inspect additional references before choosing each later feature.

Shipping-company summary links retain their original routes in `shipping-companies-app/Utils.ts`. Countries is available; enable states, cities, shipments, and packaging-request links as their owning features are migrated. Keep the original card list and its pagination; this feature does not use a data table. Do not add a carrier-sync endpoint from the reference project because the legacy Ashamco feature has no such endpoint.
