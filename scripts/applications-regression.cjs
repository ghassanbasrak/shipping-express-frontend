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

const base = "src/app/main/applications-app/";
const utils = load(base + "Utils.ts");
const model = load(base + "models/ApplicationModel.ts", { "@lodash": lodash });
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const schema = load(base + "models/ApplicationSchema.ts", {
  "src/app/main/utils/validations": validations,
  "../Utils": utils,
}).applicationSchema((key) => key);
const plain = (x) => JSON.parse(JSON.stringify(x));
const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit"));
const valid = {
  id: "app-1",
  name: { en: "Shipping API", ar: "" },
  clientName: "shipping_api",
  userId: "merchant-1",
  scopes: [
    {
      id: "scope-1",
      feature: "shipments",
      read: true,
      write: true,
      maxHourlyUsage: 300,
    },
  ],
  apiKey: "server-generated-secret",
  createdAt: "today",
  user: { id: "merchant-1", firstName: "Account", lastName: "One" },
};
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
    "entity defaults clone cached scopes, IDs, names and populated users",
    () => {
      const value = model.default(valid);
      value.scopes[0].read = false;
      value.name.en = "Changed";
      value.user.firstName = "Changed";
      assert.equal(valid.scopes[0].read, true);
      assert.equal(valid.name.en, "Shipping API");
      assert.equal(valid.user.firstName, "Account");
      assert.equal(value.id, "app-1");
      assert.equal(model.default({}).scopes.length, 0);
    },
  );
  check(
    "English name, client name and owner are required; Arabic remains optional",
    () => {
      assert.equal(schema.safeParse(valid).success, true);
      assert.equal(
        schema.safeParse({ ...valid, name: { en: "Name", ar: null } }).success,
        true,
      );
      for (const changes of [
        { name: { ar: "اسم" } },
        { clientName: "" },
        { userId: "" },
      ])
        assert.equal(schema.safeParse({ ...valid, ...changes }).success, false);
    },
  );
  check("empty and optional scope arrays retain the source rule", () => {
    assert.equal(schema.safeParse({ ...valid, scopes: [] }).success, true);
    const value = { ...valid };
    delete value.scopes;
    assert.equal(schema.safeParse(value).success, true);
  });
  check(
    "hourly limits preserve optional, zero, null and existing numeric values",
    () => {
      for (const maxHourlyUsage of [undefined, 0, null, 5, -1, 1.5])
        assert.equal(
          schema.safeParse({
            ...valid,
            scopes: [{ ...valid.scopes[0], maxHourlyUsage }],
          }).success,
          true,
        );
      assert.equal(
        schema.safeParse({
          ...valid,
          scopes: [{ ...valid.scopes[0], maxHourlyUsage: "bad" }],
        }).success,
        false,
      );
    },
  );
  check(
    "known writable scopes require read without silently changing backend values",
    () => {
      const broken = {
        ...valid,
        scopes: [{ feature: "shipments", read: false, write: true }],
      };
      assert.equal(schema.safeParse(broken).success, false);
      assert.equal(broken.scopes[0].read, false);
      assert.equal(
        schema.safeParse({
          ...valid,
          scopes: [{ feature: "future-scope", read: false, write: true }],
        }).success,
        true,
      );
    },
  );
  check(
    "scope defaults enable only supported writes and retain the original 300 limit",
    () => {
      for (const feature of Object.values(utils.applicationFeatures)) {
        const scope = utils.newApplicationScope(feature);
        assert.equal(scope.read, true);
        assert.equal(
          scope.write,
          ["shipments", "shipping-users"].includes(feature),
        );
        assert.equal(scope.maxHourlyUsage, 300);
      }
    },
  );
  check(
    "serializer retains hourly limits, zero/null and unknown scopes while excluding metadata",
    () => {
      const value = utils.toApplicationSaveValues({
        ...valid,
        scopes: [
          { ...valid.scopes[0], maxHourlyUsage: 0 },
          {
            feature: "future-scope",
            read: false,
            write: true,
            maxHourlyUsage: null,
            id: "scope-2",
          },
        ],
      });
      assert.equal(value.apiKey, undefined);
      assert.equal(value.user, undefined);
      assert.equal(value.createdAt, undefined);
      assert.equal(value.scopes[0].id, undefined);
      assert.equal(value.scopes[0].maxHourlyUsage, 0);
      assert.equal(value.scopes[1].feature, "future-scope");
      assert.equal(value.scopes[1].maxHourlyUsage, null);
      assert.equal(valid.scopes[0].id, "scope-1");
    },
  );
  check(
    "scope enums and owner labels handle existing and future values",
    () => {
      assert.equal(
        utils.toApplicationFeatureTitle("shipping-users"),
        "SHIPPING_USERS",
      );
      assert.equal(
        utils.toApplicationFeatureTitle("future-scope"),
        "future-scope",
      );
      assert.equal(
        utils.toApplicationFeatureColor("shipments"),
        "bg-green-600",
      );
      assert.equal(utils.applicationUserLabel(valid.user), "Account One");
      assert.equal(
        utils.applicationUserLabel({
          id: "owner",
          email: "owner@example.test",
        }),
        "owner@example.test",
      );
      assert.equal(utils.applicationUserLabel({ id: "owner" }), "owner");
    },
  );
  const slice = load(base + "store/applicationsSlice.js", {
    "@reduxjs/toolkit": toolkit,
    "app/store/lazyLoadedSlices": { rootReducer: toolkit.combineSlices() },
  });
  check(
    "JS slice keeps ten-row pagination and resets page for every query filter",
    () => {
      let state = slice.default(
        undefined,
        slice.newApplicationsInstance({ userIdFilter: "owner" }),
      );
      assert.equal(state.pageSize, 10);
      assert.equal(state.userIdFilter, "owner");
      for (const [name, value] of [
        ["SearchText", { target: { value: "A & B" } }],
        ["UserIdFilter", "another"],
        ["DateFromFilter", new Date("2026-10-01T00:00:00Z")],
        ["DateToFilter", new Date("2026-10-23T00:00:00Z")],
      ]) {
        state = slice.default(state, slice.setApplicationsPage(3));
        state = slice.default(state, slice["setApplications" + name](value));
        assert.equal(state.page, 0);
      }
      assert.equal(typeof state.dateFromFilter, "string");
      assert.equal(JSON.parse(JSON.stringify(state)).searchText, "A & B");
    },
  );
  const client = axios.create({ baseURL: "https://applications.test" }),
    mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "applicationsTest",
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
  const module = load(base + "ApplicationsApi.ts", {
    "app/store/apiService": { apiService: api },
    lodash,
    "./models/ApplicationModel": model,
  }).default;
  const store = configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (get) => get().concat(api.middleware),
    }),
    subscriptions = [];
  function request(name, arg) {
    const result = store.dispatch(module.endpoints[name].initiate(arg));
    subscriptions.push(result);
    return result.unwrap();
  }
  try {
    await checkAsync(
      "list sends structured page, encoded search, owner and date filters",
      async () => {
        mock.onGet("v1/applications").reply((config) => {
          assert.deepEqual(config.params, {
            page: 2,
            pageSize: 10,
            search: "A & B",
            userId: "owner",
            dateFrom: "2026-10-01",
            dateTo: "2026-10-23",
          });
          return [200, { results: [valid], total: 21 }];
        });
        assert.equal(
          (
            await request("getApplications", {
              page: 2,
              pageSize: 10,
              searchText: "A & B",
              userIdFilter: "owner",
              dateFromFilter: "2026-10-01",
              dateToFilter: "2026-10-23",
            })
          ).total,
          21,
        );
      },
    );
    await checkAsync(
      "all-scope filters omit the sentinel and empty values",
      async () => {
        mock.onGet("v1/applications").reply((config) => {
          assert.deepEqual(config.params, { page: 0, pageSize: 10 });
          return [200, { results: [], total: 0 }];
        });
        await request("getApplications", {
          page: 0,
          pageSize: 10,
          userIdFilter: "all",
          searchText: "",
        });
      },
    );
    await checkAsync(
      "detail keeps raw API key, owner and scope IDs from the backend",
      async () => {
        mock.onGet("v1/applications/app-1").reply(200, valid);
        const value = await request("getApplication", "app-1");
        assert.equal(value.apiKey, "server-generated-secret");
        assert.equal(value.user.id, "merchant-1");
        assert.equal(value.scopes[0].id, "scope-1");
      },
    );
    await checkAsync(
      "account search preserves type=user and current search text",
      async () => {
        mock.onGet("v1/users").reply((config) => {
          assert.deepEqual(config.params, {
            type: "user",
            search: "One & More",
          });
          return [200, { results: [valid.user], total: 1 }];
        });
        assert.equal(
          (await request("getApplicationUsers", { searchText: "One & More" }))
            .results[0].id,
          "merchant-1",
        );
      },
    );
    await checkAsync(
      "selected-account fallback loads the actual stored ID independently of search results",
      async () => {
        mock
          .onGet("v1/users/outside-page")
          .reply(200, { id: "outside-page", firstName: "Outside" });
        assert.equal(
          (await request("getApplicationUser", "outside-page")).firstName,
          "Outside",
        );
      },
    );
    await checkAsync(
      "create posts editable fields including numeric scope limits without secrets",
      async () => {
        mock.onGet("v1/applications").reply(200, { results: [], total: 0 });
        mock.onPost("v1/applications").reply((config) => {
          const value = JSON.parse(config.data);
          assert.deepEqual(Object.keys(value).sort(), [
            "clientName",
            "name",
            "scopes",
            "userId",
          ]);
          assert.equal(value.scopes[0].maxHourlyUsage, 300);
          assert.equal(value.scopes[0].id, undefined);
          assert.equal(value.apiKey, undefined);
          return [200, { ...value, id: "created" }];
        });
        assert.equal(
          (
            await request(
              "createApplication",
              utils.toApplicationSaveValues(valid),
            )
          ).id,
          "created",
        );
      },
    );
    await checkAsync(
      "update uses the selected parent ID and sends edited limits with no populated references",
      async () => {
        mock.onPatch("v1/applications/app-1").reply((config) => {
          const value = JSON.parse(config.data);
          assert.equal(value.scopes[0].maxHourlyUsage, 0);
          assert.equal(value.id, undefined);
          assert.equal(value.user, undefined);
          assert.equal(value.apiKey, undefined);
          return [200, { ...value, id: "app-1" }];
        });
        await request(
          "updateApplication",
          utils.toApplicationSaveValues({
            ...valid,
            scopes: [{ ...valid.scopes[0], maxHourlyUsage: 0 }],
          }),
        );
      },
    );
    await checkAsync(
      "delete targets the requested ID independently of the cached detail",
      async () => {
        mock.onDelete("v1/applications/app-2").reply(204);
        await request("removeApplication", "app-2");
        assert.equal(mock.history.delete.at(-1).url, "v1/applications/app-2");
      },
    );
    check(
      "cache invalidation selects the matching detail and leaves another entity alone",
      () => {
        assert.equal(
          api.util
            .selectInvalidatedBy(store.getState(), [
              { type: "Application", id: "app-2" },
            ])
            .some((x) => x.originalArgs === "app-1"),
          false,
        );
        assert.equal(
          api.util
            .selectInvalidatedBy(store.getState(), [
              { type: "Application", id: "app-1" },
            ])
            .some((x) => x.originalArgs === "app-1"),
          true,
        );
      },
    );
    await checkAsync(
      "failed writes and deletion reject without hidden fallback mutations",
      async () => {
        mock.onPost("v1/applications").reply(500, { message: "failed" });
        mock
          .onDelete("v1/applications/failed")
          .reply(500, { message: "failed" });
        const patches = mock.history.patch.length;
        await assert.rejects(request("createApplication", valid));
        await assert.rejects(request("removeApplication", "failed"));
        assert.equal(mock.history.patch.length, patches);
      },
    );
  } finally {
    subscriptions.forEach((x) => x.unsubscribe?.());
    store.dispatch(api.util.resetApiState());
    mock.restore();
  }
  check(
    "migration inventory accounts for all areas without claiming scope owner screens migrated",
    () => {
      const ledger = JSON.parse(
        fs.readFileSync(path.join(target, "migration-status.json"), "utf8"),
      );
      assert.equal(ledger.features.length, 32);
      assert.equal(
        ledger.features.find((x) => x.feature === "applications-app").status,
        "migrated",
      );
      assert.equal(
        ledger.features.find((x) => x.feature === "shipments-app").status,
        "pending",
      );
      for (const status of ["migrated", "partial", "pending"])
        assert.equal(
          ledger.counts[status],
          ledger.features.filter((x) => x.status === status).length,
        );
    },
  );
  console.log(`${passed}/${passed} application regression checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
