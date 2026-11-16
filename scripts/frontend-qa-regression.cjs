const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("../node_modules/typescript");
const toolkit = require("../node_modules/@reduxjs/toolkit");
function load(file, imports = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(file, "utf8").replace(/import\.meta\.env/g, "({})"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      },
    ).outputText,
    {
      exports,
      URL,
      require: (name) => {
        if (name in imports) return imports[name];
        throw Error(name);
      },
    },
  );
  return exports;
}
const permissions = { hasOperationPermission: () => false };
const payments = load("src/app/main/payments-app/Utils.ts", {
  "src/app/auth/permissions": permissions,
  "../transactions-app/Utils": { availableTransactionBalances: () => [] },
});
const contacts = load("src/app/main/shipment-users-app/Utils.ts");
const coupons = load("src/app/main/coupons-app/Utils.ts");
const shipments = load("src/app/main/shipments-app/Utils.ts", {
  "src/app/auth/user": { userRoles: {} },
  "src/brand/tokens": {},
  "src/app/auth/permissions": permissions,
  "../shipment-users-app/Utils": contacts,
  "../countries-app/Utils": { displayName: () => "" },
});
const storage = load("src/app/main/storage-app/Utils.ts", {
  "../storage-subscriptions-app/Utils": load(
    "src/app/main/storage-subscriptions-app/Utils.ts",
  ),
});
const slice = load("src/app/main/payments-app/store/paymentsSlice.js", {
  "@reduxjs/toolkit": toolkit,
  "app/store/lazyLoadedSlices": { rootReducer: toolkit.combineSlices() },
});
let definitions;
const api = {
  enhanceEndpoints: () => ({
    injectEndpoints: (config) => {
      definitions = config.endpoints({ query: (x) => x, mutation: (x) => x });
      return {};
    },
  }),
};
load("src/app/main/payments-app/PaymentsApi.ts", {
  "app/store/apiService": { apiService: api },
});
const plain = (value) => JSON.parse(JSON.stringify(value));
const user = { id: "owner", role: "user" },
  record = {
    id: "payment",
    userId: "owner",
    type: payments.paymentType.topup,
    status: payments.paymentStatus.pending,
  };
let passed = 0;
async function check(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
(async () => {
  await check(
    "failed verification retains the owned payment with an explicit warning",
    async () => {
      const result = await payments.loadPaymentResult(
        user,
        "payment",
        async () => record,
        async () => {
          throw { status: 500 };
        },
      );
      assert.equal(result.payment, record);
      assert.equal(result.verificationFailed, true);
    },
  );
  await check(
    "confirmed status requires a valid verification response",
    async () => {
      const result = await payments.loadPaymentResult(
        user,
        "payment",
        async () => record,
        async () => ({ ...record, status: payments.paymentStatus.confirmed }),
      );
      assert.equal(result.payment.status, "success");
      assert.equal(result.verificationFailed, false);
    },
  );
  await check(
    "missing, foreign and mismatched payment records are never displayed",
    async () => {
      for (const value of [
        { ...record, userId: "other" },
        { ...record, id: "other" },
        { ...record, type: "unknown" },
      ])
        await assert.rejects(
          payments.loadPaymentResult(
            user,
            "payment",
            async () => value,
            async () => record,
          ),
        );
      await assert.rejects(
        payments.loadPaymentResult(
          user,
          "",
          async () => {
            throw Error("must not read");
          },
          async () => record,
        ),
        /Missing payment ID/,
      );
      await assert.rejects(
        payments.loadPaymentResult(
          user,
          "payment",
          async () => {
            throw { status: 404 };
          },
          async () => record,
        ),
        (error) => error.status === 404,
      );
    },
  );
  await check(
    "authorization failures propagate and untrusted verification never replaces the saved payment",
    async () => {
      for (const status of [401, 403])
        await assert.rejects(
          payments.loadPaymentResult(
            user,
            "payment",
            async () => record,
            async () => {
              throw { status };
            },
          ),
          (error) => error.status === status,
        );
      const result = await payments.loadPaymentResult(
        user,
        "payment",
        async () => record,
        async () => ({ ...record, userId: "other", status: "success" }),
      );
      assert.equal(result.payment, record);
      assert.equal(result.verificationFailed, true);
    },
  );
  await check(
    "storage results remain delegated to entitlement verification",
    async () => {
      const result = await payments.loadPaymentResult(
        user,
        "payment",
        async () => ({
          ...record,
          type: payments.paymentType.storageSubscription,
        }),
        async () => {
          throw Error("must not call");
        },
      );
      assert.equal(result.payment.type, "storageSubscription");
    },
  );
  await check(
    "payment filters serialize enum values, omit all, and verification sends an empty body",
    () => {
      const query = definitions.getPayments.query({
        page: 2,
        pageSize: 10,
        typeFilter: "storageSubscription",
        paymentMethodTypeFilter: "free",
      });
      assert.equal(query.params.type, "storageSubscription");
      assert.equal(query.params.paymentMethodType, "free");
      const all = definitions.getPayments.query({
        page: 0,
        pageSize: 10,
        typeFilter: "all",
        paymentMethodTypeFilter: "all",
      });
      assert.equal(all.params.type, undefined);
      assert.equal(all.params.paymentMethodType, undefined);
      assert.deepEqual(
        plain(
          definitions.checkPaymentStatus.query({
            id: "payment",
            userId: "owner",
          }).data,
        ),
        {},
      );
    },
  );
  await check(
    "purpose and method changes unwrap dropdown events, reset pagination and clear on reset",
    () => {
      let state = slice.default(undefined, { type: "init" });
      state = slice.default(state, slice.setPaymentsPage(3));
      state = slice.default(
        state,
        slice.setPaymentsTypeFilter({ target: { value: "topup" } }),
      );
      assert.equal(state.page, 0);
      assert.equal(state.typeFilter, "topup");
      state = slice.default(
        state,
        slice.setPaymentsPaymentMethodTypeFilter("mada"),
      );
      assert.equal(state.paymentMethodTypeFilter, "mada");
      state = slice.default(state, slice.resetPayments());
      assert.equal(state.typeFilter, "all");
      assert.equal(state.paymentMethodTypeFilter, "all");
    },
  );
  await check(
    "late saved-contact hydration preserves edits and dependent phone/geography fields",
    () => {
      const initial = {
        senderName: "A",
        senderPhone: "1",
        senderPhoneCountry: "+966",
        senderCountryId: "sa",
        senderStateId: "s",
        senderCityId: "c",
        senderStreet: "Old",
        senderNationalAddress: "Old code",
      };
      const incoming = {
        ...initial,
        senderName: "Server",
        senderPhone: "2",
        senderPhoneCountry: "+1",
        senderStreet: "Server street",
        senderNationalAddress: "Server code",
      };
      let current = {
        ...initial,
        senderName: "Typed",
        senderNationalAddress: "Typed code",
      };
      let result = shipments.mergeSavedShipmentContact(
        incoming,
        initial,
        current,
        "sender",
      );
      assert.equal(result.senderName, undefined);
      assert.equal(result.senderNationalAddress, undefined);
      assert.equal(result.senderStreet, "Server street");
      current = {
        ...initial,
        senderCountryId: "other",
        senderPhone: "User phone",
      };
      result = shipments.mergeSavedShipmentContact(
        incoming,
        initial,
        current,
        "sender",
      );
      for (const key of [
        "senderCountryId",
        "senderStateId",
        "senderCityId",
        "senderStreet",
        "senderNationalAddress",
        "senderPhone",
        "senderPhoneCountry",
      ])
        assert.equal(result[key], undefined);
    },
  );
  await check(
    "minimal contacts omit empty optional city and new coupons omit null expiry without losing explicit update clears",
    () => {
      const saved = contacts.toShipmentUserSaveValues({
        fullName: "A",
        type: "receiver",
        phone: "555123456",
        phoneCountry: "+966",
        address: {
          countryId: "sa",
          stateId: "s",
          cityId: "",
          street: "",
          zipCode: "",
        },
      });
      assert.equal("cityId" in saved.address, false);
      assert.equal(
        coupons.toCouponSaveValues({ expiresAt: null }, true).expiresAt,
        undefined,
      );
      assert.equal(
        coupons.toCouponSaveValues({ id: "existing", expiresAt: null })
          .expiresAt,
        null,
      );
    },
  );
  await check(
    "unconfigured storage plans cannot start checkout and gateway setup details have friendly copy",
    () => {
      for (const storageTypes of [undefined, [], ["legacy"], ["dry", "legacy"]])
        assert.equal(storage.isStoragePlanConfigured({ storageTypes }), false);
      assert.equal(
        storage.isStoragePlanConfigured({ storageTypes: ["dry", "chilled"] }),
        true,
      );
      assert.equal(
        payments.onlinePaymentError(
          { data: { message: "Moyasar secret key is not configured" } },
          "fallback",
          "unavailable",
        ),
        "unavailable",
      );
    },
  );
  console.log(`${passed}/${passed} frontend QA regression checks passed.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
