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

const base = "src/app/main/bank-transfers-app/";
const permissions = load("src/app/auth/permissions.ts");
const utils = load(base + "Utils.ts", {
  "src/app/auth/permissions": permissions,
});
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const schema = load(base + "models/BankTransferSchema.ts", {
  "src/app/main/utils/validations": validations,
});
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
  check(
    "approval requires a bank; shared validation accepts all original choices",
    () => {
      const approval = schema.bankTransferApprovalSchema((key) => key);
      assert.equal(approval.safeParse({ bank: "" }).success, false);
      assert.equal(approval.safeParse({}).success, false);
      for (const bank of Object.values(utils.banks))
        assert.equal(approval.safeParse({ bank }).success, true);
    },
  );
  check("rejection preserves optional empty, null and supplied notes", () => {
    const rejection = schema.bankTransferRejectionSchema();
    for (const notes of [undefined, null, "", "Rejection reason"])
      assert.equal(rejection.safeParse({ notes }).success, true);
  });
  check(
    "pending-only review requires staff with both view and update grants",
    () => {
      const staff = {
        role: "employee",
        features: [
          { feature: "bank-transfers", accessView: true, accessUpdate: true },
        ],
      };
      assert.equal(utils.canReviewBankTransfer(staff, "pending"), true);
      for (const status of ["approved", "rejected", "future"])
        assert.equal(utils.canReviewBankTransfer(staff, status), false);
      for (const changes of [
        { accessView: false, accessUpdate: true },
        { accessView: true, accessUpdate: false },
      ])
        assert.equal(
          utils.canReviewBankTransfer(
            { ...staff, features: [{ feature: "bank-transfers", ...changes }] },
            "pending",
          ),
          false,
        );
      assert.equal(
        utils.canReviewBankTransfer({ role: "user" }, "pending"),
        false,
      );
      assert.equal(
        utils.canReviewBankTransfer({ role: "admin", features: [] }, "pending"),
        true,
      );
    },
  );
  const slice = load(base + "store/bankTransfersSlice.js", {
    "@reduxjs/toolkit": toolkit,
    "app/store/lazyLoadedSlices": { rootReducer: toolkit.combineSlices() },
  });
  check(
    "JS list state applies account/reviewer route scope and resets pagination for filters",
    () => {
      let state = slice.default(
        undefined,
        slice.newBankTransfersInstance({
          userIdFilter: "merchant",
          updatedByIdFilter: "reviewer",
        }),
      );
      assert.equal(state.userIdFilter, "merchant");
      assert.equal(state.updatedByIdFilter, "reviewer");
      assert.equal(state.pageSize, 10);
      for (const [name, value] of [
        ["SearchText", { target: { value: "A & B" } }],
        ["UserIdFilter", "other"],
        ["UpdatedByIdFilter", "reviewer-2"],
        ["StatusFilter", "pending"],
        ["DateFromFilter", new Date("2026-10-01")],
        ["DateToFilter", new Date("2026-10-23")],
      ]) {
        state = slice.default(state, slice.setBankTransfersPage(3));
        state = slice.default(state, slice["setBankTransfers" + name](value));
        assert.equal(state.page, 0);
      }
      assert.equal(state.searchText, "A & B");
      assert.equal(state.dateFromFilter, "2026-10-01T00:00:00.000Z");
      state = slice.default(state, slice.setBankTransfersPage(3));
      state = slice.default(state, slice.setBankTransfersPageSize(25));
      assert.equal(state.page, 0);
      assert.equal(state.pageSize, 25);
    },
  );
  const client = axios.create({ baseURL: "https://bank-transfers.test" }),
    mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "bankTransfersTest",
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
  const module = load(base + "BankTransfersApi.ts", {
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
      "list and export retain bankTransfer type, pagination and every active filter",
      async () => {
        mock.onGet("v1/requests").reply((config) => {
          assert.deepEqual(config.params, {
            page: 2,
            pageSize: 10,
            type: "bankTransfer",
            search: "A & B",
            status: "pending",
            userId: "merchant",
            updatedById: "reviewer",
            dateFrom: "2026-10-01",
            dateTo: "2026-10-23",
          });
          return [
            200,
            {
              results: [
                {
                  id: "transfer-1",
                  amount: 0,
                  paymentPlan: { id: "plan", name: "Plan" },
                  user: { id: "merchant" },
                  updatedBy: { id: "reviewer" },
                },
              ],
              total: 21,
            },
          ];
        });
        const value = await request("getBankTransfers", {
          page: 2,
          pageSize: 10,
          searchText: "A & B",
          statusFilter: "pending",
          userIdFilter: "merchant",
          updatedByIdFilter: "reviewer",
          dateFromFilter: "2026-10-01",
          dateToFilter: "2026-10-23",
        });
        assert.equal(value.total, 21);
        assert.equal(value.results[0].amount, 0);
        assert.equal(value.results[0].paymentPlan.name, "Plan");
      },
    );
    await checkAsync(
      "all sentinel and empty filters are omitted without normalization",
      async () => {
        mock.onGet("v1/requests").reply((config) => {
          assert.deepEqual(config.params, {
            page: 0,
            pageSize: 10,
            type: "bankTransfer",
          });
          return [200, { results: [], total: 0 }];
        });
        await request("getBankTransfers", {
          page: 0,
          pageSize: 10,
          userIdFilter: "all",
          updatedByIdFilter: "all",
          statusFilter: "all",
          searchText: "",
        });
      },
    );
    await checkAsync(
      "selected account fallback reads its actual ID",
      async () => {
        mock
          .onGet("v1/users/outside-page")
          .reply(200, { id: "outside-page", firstName: "Outside" });
        assert.equal(
          (await request("getBankTransfersUser", "outside-page")).firstName,
          "Outside",
        );
      },
    );
    await checkAsync(
      "approval PATCH contains status and bank only and targets selected transfer ID",
      async () => {
        mock.onGet("v1/requests").reply(200, { results: [], total: 0 });
        mock.onPatch("v1/requests/transfer-1").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), {
            status: "approved",
            bank: "alrajhiBank",
          });
          return [200, { id: "transfer-1", status: "approved" }];
        });
        assert.equal(
          (
            await request("setBankTransferStatus", {
              id: "transfer-1",
              userId: "merchant",
              status: "approved",
              bank: "alrajhiBank",
              amount: 500,
              notes: "excluded",
              user: { id: "merchant" },
            })
          ).id,
          "transfer-1",
        );
      },
    );
    await checkAsync(
      "rejection PATCH contains optional notes and status only",
      async () => {
        mock.onPatch("v1/requests/transfer-2").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), {
            status: "rejected",
            notes: "Reason",
          });
          return [200, { id: "transfer-2", status: "rejected" }];
        });
        await request("setBankTransferStatus", {
          id: "transfer-2",
          status: "rejected",
          notes: "Reason",
          bank: "box",
          amount: 300,
        });
        mock.onPatch("v1/requests/transfer-3").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), {
            status: "rejected",
            notes: "",
          });
          return [200, { id: "transfer-3" }];
        });
        await request("setBankTransferStatus", {
          id: "transfer-3",
          status: "rejected",
        });
      },
    );
    await checkAsync(
      "filtered export requests page zero and original large page size",
      async () => {
        mock.onGet("v1/requests").reply((config) => {
          assert.deepEqual(config.params, {
            page: 0,
            pageSize: 500000,
            type: "bankTransfer",
            status: "pending",
            userId: "merchant",
            updatedById: "reviewer",
          });
          return [200, { results: [], total: 0 }];
        });
        await request("getBankTransfers", {
          page: 0,
          pageSize: 500000,
          statusFilter: "pending",
          userIdFilter: "merchant",
          updatedByIdFilter: "reviewer",
        });
      },
    );
    await checkAsync(
      "failed decisions reject; no creation or deletion fallback is issued",
      async () => {
        mock.onGet("v1/requests").reply(200, { results: [], total: 0 });
        mock.onPatch("v1/requests/failed").reply(500, { message: "failed" });
        await assert.rejects(
          request("setBankTransferStatus", {
            id: "failed",
            status: "approved",
            bank: "box",
          }),
        );
        assert.equal(mock.history.post.length, 0);
        assert.equal(mock.history.delete.length, 0);
      },
    );
    check(
      "decision invalidation refreshes list and matching account rather than every account",
      () => {
        const invalidated = api.util.selectInvalidatedBy(store.getState(), [
          { type: "BankTransfersUser", id: "outside-page" },
        ]);
        assert.ok(
          invalidated.some(
            (x) =>
              x.endpointName === "getBankTransfersUser" &&
              x.originalArgs === "outside-page",
          ),
        );
        assert.equal(
          api.util.selectInvalidatedBy(store.getState(), [
            { type: "BankTransfersUser", id: "another" },
          ]).length,
          0,
        );
        assert.ok(
          api.util
            .selectInvalidatedBy(store.getState(), ["BankTransfers"])
            .some((x) => x.endpointName === "getBankTransfers"),
        );
      },
    );
  } finally {
    subscriptions.forEach((x) => x.unsubscribe?.());
    store.dispatch(api.util.resetApiState());
    mock.restore();
  }
  console.log(`${passed}/${passed} bank-transfer regression checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
