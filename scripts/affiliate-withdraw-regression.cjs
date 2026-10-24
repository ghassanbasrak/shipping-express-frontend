const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const target = path.resolve(__dirname, "..");
const root = target;
const ts = require(path.join(target, "node_modules/typescript"));
const axios = require(
  path.join(target, "node_modules/axios/dist/node/axios.cjs"),
);
const MockAdapter = require(
  path.join(target, "node_modules/axios-mock-adapter"),
);
const { createApi } = require(
  path.join(target, "node_modules/@reduxjs/toolkit/query/react"),
);
const { configureStore } = require(
  path.join(target, "node_modules/@reduxjs/toolkit"),
);
const zod = require(path.join(target, "node_modules/zod"));
function load(file, imports = {}) {
  const exports = {};
  const js = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(
    js,
    {
      exports,
      require: (name) => {
        if (name in imports) return imports[name];
        if (name === "zod") return zod;
        throw new Error("Unexpected import " + name);
      },
      Date,
      console,
      Set,
    },
    { filename: file },
  );
  return exports;
}
const lodash = require(path.join(target, "node_modules/lodash"));

const base = "src/app/main/affiliate-withdraw-requests-app/";
const permissions = load("src/app/auth/permissions.ts");
const utils = load(base + "Utils.ts", {
  "src/app/auth/permissions": permissions,
});
const model = load(base + "models/AffiliateWithdrawRequestModel.ts", {
  "@lodash": lodash,
  "../Utils": utils,
});
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const schemas = load(base + "models/AffiliateWithdrawRequestSchema.ts", {
  "src/app/main/utils/validations": validations,
  "../../utils/currencyFormatter": (value) => String(value),
});
const schema = schemas.affiliateWithdrawRequestSchema((key) => key),
  approval = schemas.affiliateWithdrawRequestApprovalSchema((key) => key);
const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit"));
let passed = 0;
function check(name, run) {
  run();
  passed++;
  console.log("PASS " + name);
}
async function checkAsync(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
async function main() {
  check("positive amount must not exceed a positive available balance", () => {
    for (const amount of [1, 100, 1.5])
      assert.equal(
        schema.safeParse({ amount, availableBalance: 100 }).success,
        true,
      );
    for (const changes of [
      { amount: 0 },
      { amount: -1 },
      { amount: 101 },
      { availableBalance: 0 },
      { availableBalance: -1 },
      { amount: "invalid" },
    ])
      assert.equal(
        schema.safeParse({ amount: 50, availableBalance: 100, ...changes })
          .success,
        false,
      );
  });
  check(
    "merchant banking notes stay optional and no shipment selection is imposed",
    () => {
      for (const description of [undefined, null, "", "IBAN and account name"])
        assert.equal(
          schema.safeParse({ amount: 50, availableBalance: 100, description })
            .success,
          true,
        );
    },
  );
  check(
    "staff approval requires both bank and reference; optional receipt and notes stay optional",
    () => {
      const valid = { bank: "box", transactionReference: "reference" };
      assert.equal(approval.safeParse(valid).success, true);
      for (const changes of [{ bank: "" }, { transactionReference: "" }])
        assert.equal(
          approval.safeParse({ ...valid, ...changes }).success,
          false,
        );
      assert.equal(
        approval.safeParse({
          ...valid,
          transactionImageUrl: "",
          transactionDescription: null,
        }).success,
        true,
      );
    },
  );
  check(
    "root model clones cached references, retains IDs and supplies source defaults",
    () => {
      const original = {
        id: "r1",
        amount: 100,
        user: { id: "u1", firstName: "Original" },
        updatedBy: { id: "staff" },
      };
      const value = model.default(original);
      value.user.firstName = "Changed";
      assert.equal(original.user.firstName, "Original");
      assert.equal(value.id, "r1");
      assert.equal(model.default().type, "affiliateWithdraw");
      assert.equal(model.default().status, "pending");
    },
  );
  check(
    "affiliate page access and legacy withdraw-review grants remain independent",
    () => {
      const view = { feature: "affiliate-withdraw-requests", accessView: true },
        update = { feature: "withdraw-requests", accessUpdate: true };
      const staff = { role: "employee", features: [view, update] };
      assert.equal(
        utils.canReviewAffiliateWithdrawRequest(staff, "pending"),
        true,
      );
      for (const status of ["approved", "rejected"])
        assert.equal(
          utils.canReviewAffiliateWithdrawRequest(staff, status),
          false,
        );
      for (const features of [
        [view],
        [update],
        [{ ...view, accessView: false }, update],
        [{ ...view, accessUpdate: true }],
      ])
        assert.equal(
          utils.canReviewAffiliateWithdrawRequest(
            { ...staff, features },
            "pending",
          ),
          false,
        );
      assert.equal(
        utils.canViewAffiliateWithdrawRequests({
          role: "user",
          isAffiliate: true,
        }),
        true,
      );
      assert.equal(
        utils.canViewAffiliateWithdrawRequests({
          role: "user",
          isAffiliate: false,
        }),
        false,
      );
      assert.equal(
        utils.canReviewAffiliateWithdrawRequest(
          { role: "user", isAffiliate: true },
          "pending",
        ),
        false,
      );
    },
  );
  const slice = load(base + "store/affiliateWithdrawRequestsSlice.js", {
    "@reduxjs/toolkit": toolkit,
    "app/store/lazyLoadedSlices": { rootReducer: toolkit.combineSlices() },
  });
  check(
    "JS slice initializes route scope and resets pagination for all filters",
    () => {
      let state = slice.default(
        undefined,
        slice.newAffiliateWithdrawRequestsInstance({
          userIdFilter: "owner",
          updatedByIdFilter: "staff",
        }),
      );
      assert.equal(state.pageSize, 10);
      assert.equal(state.userIdFilter, "owner");
      assert.equal(state.updatedByIdFilter, "staff");
      for (const [key, value] of [
        ["SearchText", "A & B"],
        ["UserIdFilter", "another"],
        ["StatusFilter", "pending"],
        ["UpdatedByIdFilter", "staff2"],
        ["DateFromFilter", new Date("2026-10-01")],
        ["DateToFilter", new Date("2026-10-23")],
      ]) {
        state = slice.default(state, slice.setAffiliateWithdrawRequestsPage(3));
        state = slice.default(
          state,
          slice["setAffiliateWithdrawRequests" + key](value),
        );
        assert.equal(state.page, 0);
      }
      assert.equal(state.dateFromFilter, "2026-10-01T00:00:00.000Z");
    },
  );
  const client = axios.create({ baseURL: "https://affiliate-withdraw.test" }),
    mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "affiliateWithdrawTest",
    keepUnusedDataFor: 0,
    endpoints: () => ({}),
    baseQuery: async (request) => {
      try {
        return { data: (await client.request(request)).data ?? null };
      } catch (e) {
        return {
          error: {
            status: e.response?.status || "NETWORK_ERROR",
            data: e.response?.data,
          },
        };
      }
    },
  });
  const module = load(base + "AffiliateWithdrawRequestsApi.ts", {
    "app/store/apiService": { apiService: api },
  }).default;
  const store = configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (get) => get().concat(api.middleware),
    }),
    subscriptions = [];
  function request(name, arg) {
    const response = store.dispatch(module.endpoints[name].initiate(arg));
    subscriptions.push(response);
    return response.unwrap();
  }
  try {
    await checkAsync(
      "list carries original type and all structured search/account/reviewer/date filters",
      async () => {
        mock.onGet("v1/requests").reply((config) => {
          assert.deepEqual(config.params, {
            page: 2,
            pageSize: 10,
            type: "affiliateWithdraw",
            search: "A & B",
            status: "pending",
            userId: "owner",
            updatedById: "staff",
            dateFrom: "2026-10-01",
            dateTo: "2026-10-23",
          });
          return [
            200,
            {
              results: [
                {
                  id: "r1",
                  amount: 0,
                  user: { id: "owner" },
                  updatedBy: { id: "staff" },
                },
              ],
              total: 21,
            },
          ];
        });
        const value = await request("getAffiliateWithdrawRequests", {
          page: 2,
          pageSize: 10,
          searchText: "A & B",
          statusFilter: "pending",
          userIdFilter: "owner",
          updatedByIdFilter: "staff",
          dateFromFilter: "2026-10-01",
          dateToFilter: "2026-10-23",
        });
        assert.equal(value.results[0].amount, 0);
        assert.equal(value.results[0].user.id, "owner");
        assert.equal(value.total, 21);
      },
    );
    await checkAsync(
      "all-scope and pending preflight requests omit account overrides and empty filters",
      async () => {
        mock.onGet("v1/requests").reply((config) => {
          assert.deepEqual(config.params, {
            page: 0,
            pageSize: 1,
            type: "affiliateWithdraw",
            status: "pending",
          });
          return [200, { results: [], total: 0 }];
        });
        await request("getAffiliateWithdrawRequests", {
          page: 0,
          pageSize: 1,
          statusFilter: "pending",
          userIdFilter: "all",
          updatedByIdFilter: "all",
          searchText: "",
        });
      },
    );
    await checkAsync(
      "balance reads the affiliate ledger using affiliateId, including zero",
      async () => {
        mock.onGet("v1/affiliate-transactions/balance").reply((config) => {
          assert.deepEqual(config.params, { affiliateId: "owner" });
          return [200, { balance: 0 }];
        });
        assert.equal(
          (await request("getAffiliateWithdrawBalance", "owner")).balance,
          0,
        );
      },
    );
    await checkAsync(
      "selected account and existing request read their real IDs and raw references",
      async () => {
        mock
          .onGet("v1/users/owner")
          .reply(200, { id: "owner", firstName: "Outside lookup" });
        assert.equal(
          (await request("getAffiliateWithdrawRequestsUser", "owner"))
            .firstName,
          "Outside lookup",
        );
        mock
          .onGet("v1/requests/r1")
          .reply(200, {
            id: "r1",
            type: "affiliateWithdraw",
            userId: "owner",
            user: { id: "owner" },
            amount: 50,
          });
        assert.equal(
          (await request("getAffiliateWithdrawRequest", "r1")).user.id,
          "owner",
        );
      },
    );
    await checkAsync(
      "create fixes request type and pending status and excludes balances, IDs and populated accounts",
      async () => {
        mock.onGet("v1/requests").reply(200, { results: [], total: 0 });
        mock
          .onGet("v1/affiliate-transactions/balance")
          .reply(200, { balance: 100 });
        mock.onPost("v1/requests").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), {
            amount: 50,
            description: "IBAN",
            userId: "owner",
            type: "affiliateWithdraw",
            status: "pending",
          });
          return [200, { id: "created" }];
        });
        assert.equal(
          (
            await request("createAffiliateWithdrawRequest", {
              amount: 50,
              description: "IBAN",
              userId: "owner",
              id: "injected",
              type: "other",
              status: "approved",
              availableBalance: 100,
              user: { id: "another" },
            })
          ).id,
          "created",
        );
      },
    );
    await checkAsync("create omits empty optional banking notes", async () => {
      mock.onPost("v1/requests").reply((config) => {
        assert.equal("description" in JSON.parse(config.data), false);
        return [200, { id: "created-2" }];
      });
      await request("createAffiliateWithdrawRequest", {
        amount: 1,
        userId: "owner",
        description: "",
      });
    });
    await checkAsync(
      "approval targets actual ID and sends only bank/reference/optional receipt details",
      async () => {
        mock.onPatch("v1/requests/r1").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), {
            status: "approved",
            bank: "box",
            transactionReference: "reference",
            transactionDescription: "Transfer note",
            transactionImageUrl: "https://receipt.test/1.jpg",
          });
          return [200, { id: "r1" }];
        });
        await request("setAffiliateWithdrawRequestStatus", {
          id: "r1",
          userId: "owner",
          status: "approved",
          bank: "box",
          transactionReference: "reference",
          transactionDescription: "Transfer note",
          transactionImageUrl: "https://receipt.test/1.jpg",
          amount: 500,
          user: { id: "owner" },
        });
      },
    );
    await checkAsync(
      "rejection sends status only and blank approval extras are omitted",
      async () => {
        mock.onPatch("v1/requests/r2").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), { status: "rejected" });
          return [200, { id: "r2" }];
        });
        await request("setAffiliateWithdrawRequestStatus", {
          id: "r2",
          status: "rejected",
          bank: "box",
          transactionReference: "omit",
          notes: "omit",
        });
        mock.onPatch("v1/requests/r3").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), {
            status: "approved",
            bank: "box",
            transactionReference: "ref",
          });
          return [200, { id: "r3" }];
        });
        await request("setAffiliateWithdrawRequestStatus", {
          id: "r3",
          status: "approved",
          bank: "box",
          transactionReference: "ref",
          transactionDescription: "",
          transactionImageUrl: "",
        });
      },
    );
    await checkAsync(
      "filtered export keeps all filters with legacy 500000 page size",
      async () => {
        mock.onGet("v1/requests").reply((config) => {
          assert.deepEqual(config.params, {
            page: 0,
            pageSize: 500000,
            type: "affiliateWithdraw",
            status: "approved",
            userId: "owner",
            updatedById: "staff",
            search: "ref",
            dateFrom: "2026-10-01",
            dateTo: "2026-10-23",
          });
          return [200, { results: [], total: 0 }];
        });
        await request("getAffiliateWithdrawRequests", {
          page: 0,
          pageSize: 500000,
          statusFilter: "approved",
          userIdFilter: "owner",
          updatedByIdFilter: "staff",
          searchText: "ref",
          dateFromFilter: "2026-10-01",
          dateToFilter: "2026-10-23",
        });
      },
    );
    await checkAsync(
      "failed create/review reject without deletion or hidden fallback mutations",
      async () => {
        mock.onGet("v1/requests").reply(200, { results: [], total: 0 });
        mock.onPost("v1/requests").reply(500, { message: "failed" });
        mock.onPatch("v1/requests/failed").reply(500, { message: "failed" });
        await assert.rejects(
          request("createAffiliateWithdrawRequest", {
            amount: 5,
            userId: "owner",
          }),
        );
        await assert.rejects(
          request("setAffiliateWithdrawRequestStatus", {
            id: "failed",
            status: "rejected",
          }),
        );
        assert.equal(mock.history.delete.length, 0);
      },
    );
    check(
      "cache tags invalidate the exact request and affiliate balance while retaining unrelated accounts",
      () => {
        assert.ok(
          api.util
            .selectInvalidatedBy(store.getState(), [
              { type: "AffiliateWithdrawBalance", id: "owner" },
            ])
            .some((x) => x.endpointName === "getAffiliateWithdrawBalance"),
        );
        assert.equal(
          api.util.selectInvalidatedBy(store.getState(), [
            { type: "AffiliateWithdrawBalance", id: "other" },
          ]).length,
          0,
        );
        assert.ok(
          api.util
            .selectInvalidatedBy(store.getState(), [
              { type: "AffiliateWithdrawRequest", id: "r1" },
            ])
            .some((x) => x.originalArgs === "r1"),
        );
      },
    );
  } finally {
    subscriptions.forEach((x) => x.unsubscribe?.());
    store.dispatch(api.util.resetApiState());
    mock.restore();
  }
  console.log(
    `${passed}/${passed} affiliate withdrawal regression checks passed.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
