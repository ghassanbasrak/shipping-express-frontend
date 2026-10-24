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

const plain = (x) => JSON.parse(JSON.stringify(x));
let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log("PASS " + name);
}
async function checkAsync(name, fn) {
  await fn();
  passed++;
  console.log("PASS " + name);
}
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (k) => k },
  validator: require(path.join(target, "node_modules/validator")),
});
const schema = load(
  "src/app/main/auth-requests-app/models/AuthRequestSchema.ts",
  { "src/app/main/utils/validations": validations },
).authRequestSchema((k) => k);
const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function main() {
  check(
    "authorization requires notes and uploaded file; populations are not form contracts",
    () => {
      assert.equal(
        schema.safeParse({
          description: "Account documents",
          fileUrl: "https://uploads.example.test/doc.pdf",
        }).success,
        true,
      );
      for (const value of [
        { description: "", fileUrl: "x" },
        { description: "Notes", fileUrl: "" },
      ])
        assert.equal(schema.safeParse(value).success, false);
    },
  );
  for (const [entity, plural, folder, kind, verification] of [
    ["AuthRequest", "AuthRequests", "auth-requests", "authorization", false],
    [
      "VerificationRequest",
      "VerificationRequests",
      "verification-requests",
      "verification",
      true,
    ],
  ]) {
    const base = "src/app/main/" + folder + "-app/",
      lower = entity[0].toLowerCase() + entity.slice(1),
      lists = plural[0].toLowerCase() + plural.slice(1);
    const utils = load(base + "Utils.ts"),
      model = load(base + "models/" + entity + "Model.ts", {
        "@lodash": lodash,
        "../Utils": utils,
      });
    check(
      entity +
        ": defaults preserve server IDs and do not mutate cached records",
      () => {
        const data = {
          id: "request-1",
          status: "approved",
          user: { id: "owner" },
          userId: "owner",
        };
        const value = model.default(data);
        value.user.id = "changed";
        assert.equal(data.user.id, "owner");
        assert.equal(value.id, "request-1");
        assert.equal(value.status, "approved");
        assert.equal(model.default({}).type, kind);
      },
    );
    check(
      entity +
        ": decision rules preserve pending-only authorization and reversible verification",
      () => {
        const review = utils["canReview" + entity];
        for (const current of ["pending", "approved", "rejected"])
          for (const next of ["approved", "rejected"])
            assert.equal(
              review(current, next),
              verification ? current !== next : current === "pending",
              current + " -> " + next,
            );
        assert.equal(review("unknown", "approved"), false);
        assert.equal(review("pending", "pending"), false);
      },
    );
    check(
      entity + ": enum titles/colors and scoped routes retain backend values",
      () => {
        assert.equal(
          utils["to" + entity + "StatusTitle"]("approved"),
          "CONFIRMED",
        );
        assert.equal(
          utils["to" + entity + "StatusColor"]("rejected"),
          "bg-red-600",
        );
        assert.equal(utils[lists + "Path"]("owner"), "/" + folder + "/owner");
        if (verification) {
          assert.equal(
            utils.toVerificationRequestUserTypeTitle("smallStore"),
            "SMALL_STORE",
          );
          assert.equal(
            utils.toVerificationRequestUserTypeColor("company"),
            "bg-green-500",
          );
        }
      },
    );
    const slice = load(base + "store/" + lists + "Slice.js", {
      "@reduxjs/toolkit": toolkit,
      "app/store/lazyLoadedSlices": { rootReducer: toolkit.combineSlices() },
    });
    check(
      entity +
        ": JS slice initializes route scopes and resets page on filter changes",
      () => {
        let s = slice.default(
          undefined,
          slice["new" + plural + "Instance"]({
            userIdFilter: "owner",
            updatedByIdFilter: "reviewer",
          }),
        );
        assert.equal(s.pageSize, 10);
        assert.equal(s.userIdFilter, "owner");
        if (verification) assert.equal(s.updatedByIdFilter, "reviewer");
        for (const [field, value] of [
          ["SearchText", { target: { value: "A & B" } }],
          ["StatusFilter", "pending"],
          ["UserIdFilter", "next"],
          ["DateFromFilter", new Date("2026-10-01T00:00:00Z")],
          ["DateToFilter", new Date("2026-10-22T00:00:00Z")],
          ...(verification ? [["UpdatedByIdFilter", "second"]] : []),
        ]) {
          s = slice.default(s, slice["set" + plural + "Page"](3));
          s = slice.default(s, slice["set" + plural + field](value));
          assert.equal(s.page, 0);
        }
        assert.equal(typeof s.dateFromFilter, "string");
        assert.doesNotThrow(() => JSON.stringify(s));
      },
    );
    const client = axios.create({ baseURL: "https://account-requests.test" }),
      mock = new MockAdapter(client);
    const api = createApi({
      reducerPath: "requestsTest" + entity,
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
    const module = load(base + plural + "Api.ts", {
      "app/store/apiService": { apiService: api },
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
        entity +
          ": filtered lists encode search, merchant/date scopes and request type",
        async () => {
          mock.onGet("v1/requests").reply((config) => {
            assert.deepEqual(config.params, {
              page: 2,
              pageSize: 10,
              type: kind,
              search: "A & B",
              userId: "owner",
              status: "pending",
              dateFrom: "2026-10-01",
              dateTo: "2026-10-22",
              ...(verification ? { updatedById: "reviewer" } : {}),
            });
            return [
              200,
              {
                results: [{ id: "request-1", type: kind, status: "pending" }],
                total: 21,
              },
            ];
          });
          const data = await request("get" + plural, {
            page: 2,
            pageSize: 10,
            searchText: "A & B",
            userIdFilter: "owner",
            statusFilter: "pending",
            dateFromFilter: "2026-10-01",
            dateToFilter: "2026-10-22",
            updatedByIdFilter: "reviewer",
          });
          assert.equal(data.total, 21);
        },
      );
      await checkAsync(
        entity + ": all scopes omit sentinel values",
        async () => {
          mock.onGet("v1/requests").reply((config) => {
            assert.deepEqual(config.params, {
              page: 0,
              pageSize: 10,
              type: kind,
            });
            return [200, { results: [], total: 0 }];
          });
          await request("get" + plural, {
            page: 0,
            pageSize: 10,
            userIdFilter: "all",
            statusFilter: "all",
            updatedByIdFilter: "all",
          });
        },
      );
      await checkAsync(
        entity + ": export-all query retains filters and legacy all-pages size",
        async () => {
          mock.onGet("v1/requests").reply((config) => {
            assert.equal(config.params.page, 0);
            assert.equal(config.params.pageSize, 500000);
            assert.equal(config.params.userId, "owner");
            assert.equal(config.params.type, kind);
            assert.equal(config.params.status, "rejected");
            if (verification)
              assert.equal(config.params.updatedById, "reviewer");
            return [200, { results: [], total: 0 }];
          });
          await request("get" + plural, {
            page: 0,
            pageSize: 500000,
            userIdFilter: "owner",
            statusFilter: "rejected",
            updatedByIdFilter: "reviewer",
          });
        },
      );
      await checkAsync(
        entity + ": detail and account lookup preserve raw nested references",
        async () => {
          mock.onGet("v1/requests/request-1").reply(200, {
            id: "request-1",
            type: kind,
            status: "pending",
            userId: "owner",
            user: { id: "owner", firstName: "Account" },
          });
          mock.onGet("v1/users/owner").reply(200, {
            id: "owner",
            firstName: "Account",
            isAuthorized: false,
          });
          assert.equal(
            (await request("get" + entity, "request-1")).user.firstName,
            "Account",
          );
          assert.equal(
            (await request("get" + plural + "User", "owner")).isAuthorized,
            false,
          );
        },
      );
      await checkAsync(
        entity + ": decision PATCH sends only status and the selected row ID",
        async () => {
          mock.onGet("v1/requests").reply(200, { results: [], total: 0 });
          mock.onPatch("v1/requests/request-2").reply((config) => {
            assert.deepEqual(JSON.parse(config.data), { status: "approved" });
            return [200, { id: "request-2", status: "approved", type: kind }];
          });
          await request("set" + entity + "Status", {
            id: "request-2",
            status: "approved",
            userId: "owner",
            type: "other",
            fileUrl: "wrong",
            description: "wrong",
          });
          assert.equal(mock.history.patch.at(-1).url, "v1/requests/request-2");
        },
      );
      await checkAsync(
        entity +
          ": review invalidates active lists and matching account details",
        async () => {
          const before = mock.history.get.filter(
            (x) => x.url === "v1/users/owner",
          ).length;
          await request("set" + entity + "Status", {
            id: "request-2",
            status: "approved",
            userId: "owner",
          });
          for (
            let i = 0;
            i < 30 &&
            mock.history.get.filter((x) => x.url === "v1/users/owner")
              .length === before;
            i++
          )
            await sleep(10);
          assert.ok(
            mock.history.get.filter((x) => x.url === "v1/users/owner").length >
              before,
          );
          const affected = api.util.selectInvalidatedBy(store.getState(), [
            { type: entity, id: "request-2" },
          ]);
          assert.equal(
            affected.some((x) => x.originalArgs === "request-1"),
            false,
          );
        },
      );
      await checkAsync(
        entity + ": failed review rejects without creating or deleting records",
        async () => {
          mock.onPatch("v1/requests/failed").reply(500, { message: "failed" });
          await assert.rejects(
            request("set" + entity + "Status", {
              id: "failed",
              status: "rejected",
            }),
          );
          assert.equal(mock.history.post.length, 0);
          assert.equal(mock.history.delete.length, 0);
        },
      );
      if (!verification)
        await checkAsync(
          "authorization create forces type/status and strips populations, IDs and metadata",
          async () => {
            mock.onPost("v1/requests").reply((config) => {
              assert.deepEqual(JSON.parse(config.data), {
                description: "Notes",
                fileUrl: "https://uploads.example.test/doc.pdf",
                userId: "owner",
                type: "authorization",
                status: "pending",
              });
              return [200, { id: "created" }];
            });
            await request("createAuthRequest", {
              id: "foreign",
              description: "Notes",
              fileUrl: "https://uploads.example.test/doc.pdf",
              userId: "owner",
              user: { id: "foreign" },
              status: "approved",
              type: "verification",
              updatedById: "foreign",
            });
          },
        );
      if (verification)
        await checkAsync(
          "onboarding verification submission invalidates the migrated review list",
          async () => {
            const auth = load("src/app/main/auth-app/AuthApi.ts", {
              "app/store/apiService": api,
            });
            mock.onPost("v1/requests").reply(200, { id: "new-verification" });
            const before = mock.history.get.filter(
              (x) => x.url === "v1/requests",
            ).length;
            await store
              .dispatch(
                api.endpoints.submitVerification.initiate({
                  type: "verification",
                  status: "pending",
                  userId: "owner",
                }),
              )
              .unwrap();
            for (
              let i = 0;
              i < 30 &&
              mock.history.get.filter((x) => x.url === "v1/requests").length ===
                before;
              i++
            )
              await sleep(10);
            assert.ok(
              mock.history.get.filter((x) => x.url === "v1/requests").length >
                before,
            );
          },
        );
    } finally {
      subscriptions.forEach((x) => x.unsubscribe?.());
      store.dispatch(api.util.resetApiState());
      mock.restore();
    }
  }
  check(
    "inventory and navigation register both migrated areas without completing merchant profiles",
    () => {
      const ledger = JSON.parse(
        fs.readFileSync(path.join(target, "migration-status.json"), "utf8"),
      );
      assert.equal(ledger.features.length, 32);
      for (const name of ["auth-requests-app", "verification-requests-app"])
        assert.equal(
          ledger.features.find((x) => x.feature === name).status,
          "migrated",
        );
      assert.equal(
        ledger.features.find((x) => x.feature === "merchants-app").status,
        "pending",
      );
      for (const status of ["migrated", "partial", "pending"])
        assert.equal(
          ledger.counts[status],
          ledger.features.filter((x) => x.status === status).length,
        );
    },
  );
  console.log(`${passed}/${passed} account-request regression checks passed.`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
