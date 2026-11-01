const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const toolkit = require("@reduxjs/toolkit");
const lodash = require("lodash");
const root = path.resolve(__dirname, "..");

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
      require(name) {
        if (name in imports) return imports[name];
        throw new Error("Unexpected import: " + name);
      },
    },
    { filename: file },
  );
  return exports;
}

const plain = (value) => JSON.parse(JSON.stringify(value));
const en = load("src/app/configs/navigation-i18n/en.ts").default;
const ar = load("src/app/configs/navigation-i18n/ar.ts").default;
const authRoles = load("src/app/auth/authRoles.ts").default;
let language = "en";
const i18next = {
  addResourceBundle() {},
  t: (key) => ({ en, ar })[language][key.replace("navigation:", "")],
};
const config = load("src/app/configs/navigationConfig.ts", {
  i18next,
  "./navigation-i18n/en": en,
  "./navigation-i18n/ar": ar,
  "src/app/auth/authRoles": authRoles,
}).default;
const model = load("src/@fuse/core/FuseNavigation/models/FuseNavItemModel.ts", {
  "@lodash": lodash,
}).default;
const helper = load("src/@fuse/utils/FuseNavigationHelper.ts", {
  "@lodash": lodash,
  "@fuse/core/FuseNavigation/models/FuseNavItemModel": model,
}).default;
const permissions = load("src/app/auth/permissions.ts");
const rootReducer = toolkit.combineSlices();
const { selectNavigation } = load(
  "src/app/theme-layouts/shared-components/navigation/store/navigationSlice.ts",
  {
    "@reduxjs/toolkit": toolkit,
    "@fuse/utils/FuseNavigationHelper": helper,
    "@fuse/core/FuseNavigation/models/FuseNavItemModel": model,
    "@fuse/utils": {
      hasPermission: helper.hasPermission,
      hasPagePermission: permissions.hasPagePermission,
    },
    "src/app/auth/user/store/userSlice": { selectUser: (state) => state.user },
    "app/store/i18nSlice": {
      selectCurrentLanguageId: (state) => state.language,
    },
    "app/configs/navigationConfig": config,
    "app/store/lazyLoadedSlices": { rootReducer },
    i18next,
  },
);
const initialState = rootReducer(undefined, { type: "init" });
function visible(user) {
  const items = selectNavigation({ ...initialState, user, language });
  const permitted = (nodes) =>
    nodes
      .filter((item) => item.hasPermission)
      .map((item) => ({
        ...item,
        children: item.children ? permitted(item.children) : undefined,
      }));
  return permitted(items);
}
const flatten = (items) =>
  items.flatMap((item) => [item, ...flatten(item.children || [])]);
const ids = (items) => plain(items.map((item) => item.id));
let passed = 0;
function check(name, run) {
  run();
  passed++;
  console.log("PASS " + name);
}

const groups = [
  "group-overview",
  "group-shipping",
  "group-finance",
  "group-accounts",
  "group-insights",
  "group-settings",
  "group-administration",
];
check(
  "group headings hold direct links with only two focused collapses",
  () => {
    const all = flatten(config);
    assert.equal(new Set(all.map((item) => item.id)).size, all.length);
    assert(config.every((item) => item.type === "group"));
    assert.deepEqual(ids(config), groups);
    assert.deepEqual(ids(config[0].children), ["home"]);
    const collapses = all.filter((item) => item.type === "collapse");
    assert.deepEqual(ids(collapses), ["nav-transactions", "nav-locations"]);
    assert.deepEqual(ids(collapses[0].children), [
      "transactions-wallet",
      "transactions-cod",
      "transaction-reports",
    ]);
    assert.deepEqual(ids(collapses[1].children), [
      "countries",
      "states",
      "cities",
    ]);
    for (const group of config) {
      assert(group.children.length > 0);
      assert(group.children.some((item) => item.type === "item"));
      assert(group.children.every((item) => item.type !== "group"));
    }
    for (const section of collapses) {
      assert(!section.url);
      assert(
        section.children.every((item) => item.type === "item" && item.url),
      );
    }
    assert.deepEqual(
      ids(all.filter((item) => item.url)).sort(),
      [
        "home",
        "affiliate-merchants",
        "affiliate-profile",
        "merchants",
        "profile",
        "topup-requests",
        "withdraw-requests",
        "logs",
        "cancel-shipment-requests",
        "merchant-dues",
        "shipments",
        "shipping-price-calculator",
        "transactions-wallet",
        "transactions-cod",
        "transaction-reports",
        "merchant-statistics",
        "affiliate-withdraw-requests",
        "bank-transfers",
        "applications",
        "shipment-users",
        "coupons",
        "alerts",
        "plans",
        "admins",
        "states",
        "cities",
        "shipping-companies",
        "countries",
      ].sort(),
    );
  },
);
check("all menu items have English and Arabic translations", () => {
  for (const item of flatten(config)) {
    assert(en[item.translate], item.id);
    assert(ar[item.translate], item.id);
  }
});
check(
  "grouping survives Redux flatten/unflatten without changing links",
  () => {
    const normalize = (items) =>
      JSON.parse(
        JSON.stringify(items, (key, value) =>
          key === "order" || (key === "children" && !value.length)
            ? undefined
            : value,
        ),
      );
    assert.deepEqual(
      normalize(helper.unflattenNavigation(helper.flattenNavigation(config))),
      normalize(config),
    );
  },
);
check("administrator sees all groups", () => {
  const items = visible({ role: "admin" });
  assert.deepEqual(ids(items), groups);
  assert(ids(flatten(items)).includes("countries"));
});
check(
  "merchant hides staff-only and affiliate-only items and empty groups",
  () => {
    const items = visible({ role: "user", isAffiliate: false });
    assert.deepEqual(ids(items), [
      "group-overview",
      "group-shipping",
      "group-finance",
      "group-accounts",
    ]);
    const visibleIds = ids(flatten(items));
    assert(visibleIds.includes("profile"));
    assert(!visibleIds.includes("affiliate-profile"));
    assert(!visibleIds.includes("affiliate-withdraw-requests"));
    assert(!visibleIds.includes("merchants"));
  },
);
check("affiliate retains account and withdrawal links", () => {
  const items = flatten(visible({ role: "user", isAffiliate: true }));
  assert(ids(items).includes("affiliate-profile"));
  assert(ids(items).includes("affiliate-withdraw-requests"));
});
check(
  "restricted staff sees only permitted children and no empty sections",
  () => {
    const items = visible({
      role: "employee",
      features: [{ feature: "transactions", accessView: true }],
    });
    assert.deepEqual(ids(items), [
      "group-overview",
      "group-shipping",
      "group-finance",
    ]);
    const finance = items.find((item) => item.id === "group-finance");
    assert.deepEqual(ids(finance.children), ["nav-transactions"]);
    assert.deepEqual(ids(finance.children[0].children), [
      "transactions-wallet",
      "transaction-reports",
    ]);
    assert.deepEqual(
      ids(items.find((item) => item.id === "group-shipping").children),
      ["shipping-price-calculator"],
    );
  },
);
check("switching locale translates group and collapse labels", () => {
  language = "ar";
  const items = visible({ role: "admin" });
  const transactions = flatten(items).find(
    (item) => item.id === "nav-transactions",
  );
  assert.equal(transactions.title, ar.NAV_TRANSACTIONS);
  assert.equal(transactions.children[0].title, ar.TRANSACTIONS);
  assert.equal(items[0].title, ar.GROUP_OVERVIEW);
  assert.equal(items[1].title, ar.GROUP_SHIPPING);
});
check(
  "empty nested sections have no permission before rendering group headings",
  () => {
    const items = selectNavigation({
      ...initialState,
      user: {
        role: "employee",
        features: [{ feature: "unknown", accessView: true }],
      },
      language,
    });
    for (const id of [
      "group-settings",
      "group-administration",
      "group-insights",
    ]) {
      assert.equal(
        items.find((item) => item.id === id).hasPermission,
        false,
        id,
      );
    }
    const finance = items.find((item) => item.id === "group-finance");
    assert.equal(finance.hasPermission, false);
    assert.equal(
      finance.children.find((item) => item.id === "nav-transactions")
        .hasPermission,
      false,
    );
  },
);
console.log(`Navigation regression checks: ${passed} passed`);
