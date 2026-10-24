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

const base = "src/app/main/shipment-users-app/";
const utils = load(base + "Utils.ts");
const model = load(base + "models/ShipmentUserModel.ts", {
  "@lodash": lodash,
  "../Utils": utils,
});
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (k) => k },
  validator: require(path.join(target, "node_modules/validator")),
});
const schema = load(base + "models/ShipmentUserSchema.ts", {
  "src/app/main/utils/validations": validations,
  "../Utils": utils,
}).shipmentUserSchema((k) => k);
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
const entity = {
  id: "contact-1",
  fullName: "Test Sender",
  type: "sender",
  phone: "+966-501234567",
  phone1: "+1-2025550123",
  email: "",
  address: {
    countryId: "country-1",
    stateId: "state-1",
    cityId: "city-1",
    street: "Street" + utils.nationalAddressSeparator + "ABCD1234",
    zipCode: "custom-zip",
  },
};
const form = utils.toShipmentUserFormValues(entity);
async function main() {
  check("entity defaults keep independent nested addresses", () => {
    const a = model.default({}),
      b = model.default({});
    a.address.street = "A";
    assert.equal(b.address.street, "");
    assert.equal(b.type, "receiver");
    assert.equal(b.userId, undefined);
  });
  check(
    "stored phones split country codes and complete national numbers",
    () => {
      assert.equal(form.phone, "501234567");
      assert.equal(form.phoneCountry, "+966");
      assert.equal(form.phone1, "2025550123");
      assert.equal(form.phoneCountry1, "+1");
      assert.equal(
        utils.splitShipmentUserPhone("+966501234567").number,
        "501234567",
      );
    },
  );
  check(
    "national address survives load/save without repeated separators",
    () => {
      const saved = utils.toShipmentUserSaveValues(form);
      assert.equal(saved.address.street, entity.address.street);
      assert.equal(
        utils.toShipmentUserSaveValues(utils.toShipmentUserFormValues(saved))
          .address.street,
        entity.address.street,
      );
      assert.equal(entity.address.nationalAddress, undefined);
    },
  );
  check(
    "national address without street and blank secondary phone remain editable",
    () => {
      const saved = utils.toShipmentUserSaveValues({
        ...form,
        phone1: "",
        address: { ...form.address, street: "" },
      });
      assert.equal(saved.phone1, "");
      assert.equal(
        saved.address.street,
        utils.nationalAddressSeparator + "ABCD1234",
      );
      assert.equal(
        utils.toShipmentUserFormValues(saved).address.nationalAddress,
        "ABCD1234",
      );
    },
  );
  check(
    "save excludes ownership, populations, aggregates and draft fields",
    () => {
      const value = utils.toShipmentUserSaveValues({
        ...form,
        userId: "foreign",
        user: { id: "foreign" },
        country: { id: "populated" },
        senderShipmentsCount: 99,
        createdAt: "today",
        address: { ...form.address, country: { id: "populated" } },
      });
      assert.deepEqual(Object.keys(value).sort(), [
        "address",
        "fullName",
        "id",
        "phone",
        "phone1",
        "type",
      ]);
      assert.equal(value.address.country, undefined);
      assert.equal(value.phone, "+966-501234567");
    },
  );
  check("schema requires name, national phone, country and state", () => {
    assert.equal(schema.safeParse(form).success, true);
    for (const changes of [
      { fullName: "A" },
      { phone: "12345" },
      { phone: "12345678901" },
      { phone: "abc123456" },
      { phoneCountry: "966" },
      { type: "other" },
      { address: { ...form.address, countryId: "" } },
      { address: { ...form.address, stateId: "" } },
    ])
      assert.equal(
        schema.safeParse({ ...form, ...changes }).success,
        false,
        JSON.stringify(changes),
      );
  });
  check(
    "legacy optional city, street, ZIP, email and secondary phone are preserved",
    () => {
      assert.equal(
        schema.safeParse({
          ...form,
          email: "legacy non-email value",
          phone1: "",
          address: { countryId: "c", stateId: "s" },
        }).success,
        true,
      );
    },
  );
  check(
    "enum titles, colors and canonical route retain route separators",
    () => {
      assert.equal(utils.toShipmentUserTypeTitle("sender"), "SENDER");
      assert.equal(utils.toShipmentUserTypeColor("receiver"), "success");
      assert.equal(utils.shipmentUsersPath("unknown"), "/shipment-users/all");
      assert.equal(
        utils.shipmentUsersPath("sender") + "/new",
        "/shipment-users/sender/new",
      );
    },
  );
  const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit"));
  const slice = load(base + "store/shipmentUsersSlice.js", {
    "@reduxjs/toolkit": toolkit,
    "app/store/lazyLoadedSlices": { rootReducer: toolkit.combineSlices() },
  });
  check(
    "JS slice keeps original page size and resets page on search/type initialization",
    () => {
      let state = slice.default(undefined, { type: "init" });
      state = slice.default(state, slice.setShipmentUsersPage(2));
      state = slice.default(
        state,
        slice.setShipmentUsersSearchText({ target: { value: "Name" } }),
      );
      assert.equal(state.page, 0);
      assert.equal(state.searchText, "Name");
      state = slice.default(
        state,
        slice.newShipmentUsersInstance({ typeFilter: "sender" }),
      );
      assert.equal(state.typeFilter, "sender");
      assert.equal(state.pageSize, 16);
      assert.equal(state.searchText, "");
    },
  );
  const client = axios.create({ baseURL: "https://shipment-users.test" }),
    mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "shipmentUsersTest",
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
  const endpoints = load(base + "ShipmentUsersApi.ts", {
    "app/store/apiService": { apiService: api },
    lodash,
    "./models/ShipmentUserModel": model,
  }).default.endpoints;
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (get) => get().concat(api.middleware),
  });
  const subscriptions = [];
  const query = (name, arg) => {
    const result = store.dispatch(endpoints[name].initiate(arg));
    subscriptions.push(result);
    return result.unwrap();
  };
  try {
    await checkAsync(
      "list sends legacy search/type/page params without owner overrides",
      async () => {
        mock.onGet("v1/shipping-users").reply((config) => {
          assert.deepEqual(config.params, {
            page: 1,
            pageSize: 16,
            search: "A & B",
            type: "sender",
          });
          return [200, { results: [entity], total: 17 }];
        });
        assert.equal(
          (
            await query("getShipmentUsers", {
              page: 1,
              pageSize: 16,
              searchText: "A & B",
              typeFilter: "sender",
            })
          ).total,
          17,
        );
      },
    );
    await checkAsync(
      "all list omits type and empty search filters",
      async () => {
        mock.onGet("v1/shipping-users").reply((config) => {
          assert.deepEqual(config.params, { page: 0, pageSize: 16 });
          return [200, { results: [], total: 0 }];
        });
        await query("getShipmentUsers", {
          page: 0,
          pageSize: 16,
          typeFilter: "all",
        });
      },
    );
    await checkAsync(
      "detail retains raw backend root populations and custom ZIP",
      async () => {
        mock.onGet("v1/shipping-users/contact-1").reply(200, {
          ...entity,
          country: { id: "country-1", name: "Country" },
        });
        const value = await query("getShipmentUser", "contact-1");
        assert.equal(value.address.zipCode, "custom-zip");
        assert.equal(value.country.name, "Country");
      },
    );
    await checkAsync(
      "create excludes server assigned owner and entity metadata",
      async () => {
        mock.onPost("v1/shipping-users").reply((config) => {
          const value = JSON.parse(config.data);
          assert.equal(value.userId, undefined);
          assert.equal(value.id, undefined);
          assert.equal(value.senderShipmentsCount, undefined);
          assert.equal(value.phone, "+966-501234567");
          return [200, { ...value, id: "created" }];
        });
        assert.equal(
          (
            await query("createShipmentUser", {
              ...utils.toShipmentUserSaveValues(form),
              userId: "foreign",
              senderShipmentsCount: 99,
            })
          ).id,
          "created",
        );
      },
    );
    await checkAsync(
      "update uses exact backend ID, editable fields and legacy phone format",
      async () => {
        mock.onPatch("v1/shipping-users/contact-1").reply((config) => {
          const value = JSON.parse(config.data);
          assert.equal(value.id, undefined);
          assert.equal(value.userId, undefined);
          assert.equal(value.phone1, "+1-2025550123");
          return [200, { ...value, id: "contact-1" }];
        });
        await query("updateShipmentUser", {
          ...utils.toShipmentUserSaveValues(form),
          userId: "foreign",
        });
      },
    );
    await checkAsync(
      "deletion targets requested row independently of open detail",
      async () => {
        mock.onDelete("v1/shipping-users/contact-2").reply(204);
        await query("removeShipmentUser", "contact-2");
        assert.equal(
          mock.history.delete.at(-1).url,
          "v1/shipping-users/contact-2",
        );
      },
    );
    await checkAsync(
      "failed saves reject and do not trigger additional mutations",
      async () => {
        mock.onPost("v1/shipping-users").reply(500, { message: "failed" });
        const before = mock.history.patch.length;
        await assert.rejects(query("createShipmentUser", entity));
        assert.equal(mock.history.patch.length, before);
      },
    );
    check("invalidation covers list and matching detail only", () => {
      const queries = api.util.selectInvalidatedBy(store.getState(), [
        { type: "ShipmentUser", id: "contact-2" },
      ]);
      assert.equal(
        queries.some((q) => q.originalArgs === "contact-1"),
        false,
      );
      const own = api.util.selectInvalidatedBy(store.getState(), [
        { type: "ShipmentUser", id: "contact-1" },
      ]);
      assert.ok(own.some((q) => q.originalArgs === "contact-1"));
    });
  } finally {
    subscriptions.forEach((x) => x.unsubscribe?.());
    store.dispatch(api.util.resetApiState());
    mock.restore();
  }
  check(
    "inventory accounts for all 32 areas and migrated address-book route",
    () => {
      const ledger = JSON.parse(
        fs.readFileSync(path.join(target, "migration-status.json"), "utf8"),
      );
      assert.equal(ledger.features.length, 32);
      const item = ledger.features.find(
        (x) =>
          x.id === "shipment-users-app" ||
          x.feature === "shipment-users-app" ||
          x.name === "shipment-users-app",
      );
      assert.equal(item?.status, "migrated");
      assert.ok(
        fs
          .readFileSync(
            path.join(target, "src/app/configs/routesConfig.tsx"),
            "utf8",
          )
          .includes("ShipmentUsersAppConfig"),
      );
    },
  );
  console.log(`${passed}/${passed} shipment-user regression checks passed.`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
