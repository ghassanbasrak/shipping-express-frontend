const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
let passed = 0;
function check(name, run) {
  run();
  passed++;
  console.log("PASS " + name);
}
function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(file)
      : /\.(ts|tsx|js|jsx|json)$/.test(file)
        ? [file]
        : [];
  });
}

check(
  "store pages, route config and commerce mock implementation are removed",
  () => {
    assert(!exists("src/app/main/merchant-services"));
    assert(!exists("src/@mock-api/api/ecommerce-api.ts"));
    for (const file of sourceFiles(path.join(root, "src"))) {
      const text = fs.readFileSync(file, "utf8");
      assert(
        !/store-authentication|store-integration|new-store|merchant-services|merchantServices|NAV_STORE_SERVICES|STORE_AUTHENTICATION|STORE_INTEGRATION|NEW_STORE|hasStore|HAS_STORE|eCommerceApiMocks|\/ecommerce\/|apps\/e-commerce/.test(
          text,
        ),
        path.relative(root, file),
      );
    }
  },
);
check("commerce mock endpoints, schemas and examples are absent", () => {
  const mock = JSON.parse(read("src/@mock-api/mock-api.json"));
  assert(!JSON.stringify(mock).match(/ecommerce/i));
  assert(
    !Object.keys(mock.paths).some((route) =>
      /\/(stores|carts|orders|products)(\/|$)/.test(route),
    ),
  );
});
check(
  "obsolete platform and commerce assets are absent; shared image fallback survives",
  () => {
    for (const asset of [
      "zid.jpg",
      "woocomerce.png",
      "coming-soon.png",
      "apps/ecommerce",
    ]) {
      assert(!exists("public/assets/images/" + asset), asset);
    }
    assert(exists("public/assets/images/image-placeholder.png"));
    assert(
      read("src/app/shared-components/custom-table/CustomTable.tsx").includes(
        "assets/images/image-placeholder.png",
      ),
    );
  },
);
check(
  "Redux state management and retained packaging fixtures are untouched",
  () => {
    assert(exists("src/app/store/store.ts"));
    assert(exists("src/app/store/apiService.ts"));
    assert(
      read("src/app/demo/demoExtraApi.ts").includes('record.type === "bags"'),
    );
    assert(
      read("src/app/main/home-app/home/MerchantHome.tsx").includes(
        'to="/package-requests/all"',
      ),
    );
  },
);
check("migration inventory explicitly excludes store services", () => {
  const status = JSON.parse(read("migration-status.json"));
  assert.equal(
    status.features.find((item) => item.feature === "merchant-services").status,
    "excluded",
  );
  assert.equal(
    status.counts.migrated,
    status.features.filter((item) => item.status === "migrated").length,
  );
  assert.equal(
    status.counts.excluded,
    status.features.filter((item) => item.status === "excluded").length,
  );
  assert.equal(status.counts.featureAreas, status.features.length);
});
console.log(`Store-removal regression checks: ${passed} passed`);
