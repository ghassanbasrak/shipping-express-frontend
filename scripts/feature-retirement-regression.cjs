const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const retired = [
  "merchant-statistics-new-app",
  "auth-requests-app",
  "verification-requests-app",
];
let passed = 0;
function check(name, run) {
  run();
  passed++;
  console.log("PASS " + name);
}
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
function files(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((item) =>
      item.isDirectory()
        ? files(path.join(dir, item.name))
        : /\.[jt]sx?$/.test(item.name)
          ? [path.join(dir, item.name)]
          : [],
    );
}
check("Retired feature folders are absent", () => {
  for (const feature of retired)
    assert(!fs.existsSync(path.join(root, "src/app/main", feature)));
});
check(
  "Runtime sources have no retired feature imports, routes, namespaces or endpoints",
  () => {
    const pattern =
      /merchant-statistics-new|merchantStatisticsNew|MerchantStatisticsNew|auth-requests|authRequests|AuthRequests|AuthRequest|AUTH_REQUESTS|MERCHANT_STATISTICS_NEW|statistics-new|verification-requests|verificationRequests|VerificationRequests|IVerificationRequest|VERIFICATION_REQUESTS/;
    for (const file of files(path.join(root, "src")))
      assert(!pattern.test(fs.readFileSync(file, "utf8")), file);
  },
);
check(
  "Route registry retains original statistics and wildcard 404 handling",
  () => {
    const routes = read("src/app/configs/routesConfig.tsx");
    assert(routes.includes("../main/merchant-statistics-app/"));
    assert(routes.includes('path: "*"'));
    assert(routes.includes('to="error/404"'));
  },
);
check(
  "Merchant profiles retain verification and account flags without an authorization-request shortcut",
  () => {
    const info = read(
      "src/app/main/merchants-app/merchant/tabs/UserInfoTab.tsx",
    );
    assert(info.includes('to="/verify-account"'));
    assert(info.includes('"isAuthorized"'));
    assert(!info.includes('t("AUTHORIZE")'));
  },
);
check(
  "Carrier authorization eligibility remains part of the shipment contract",
  () => {
    const source = read("src/app/main/shipments-app/shipment/Shipment.tsx");
    assert(source.includes("isAuthorizationRequired"));
    assert(source.includes("isAuthorized"));
  },
);
check(
  "Original statistics report helpers and PDF export remain available",
  () => {
    for (const file of [
      "MerchantStatisticsApi.ts",
      "Utils.ts",
      "merchant-statistics/components/StatisticsReportHeader.tsx",
      "merchant-statistics/components/StatisticsAmounts.tsx",
    ])
      assert(
        fs.existsSync(
          path.join(root, "src/app/main/merchant-statistics-app", file),
        ),
      );
    assert(
      read(
        "src/app/main/merchant-statistics-app/MerchantStatisticsApi.ts",
      ).includes('"v1/users/statistics"'),
    );
  },
);
check(
  "Verification onboarding remains available without retired review cache tags",
  () => {
    assert(
      read("src/app/main/auth-app/AuthApi.ts").includes("submitVerification"),
    );
    const api = read("src/app/main/auth-app/AuthApi.ts");
    assert(api.includes('url: "v1/requests"'));
    assert(!api.includes("VerificationRequests"));
    const form = read(
      "src/app/main/auth-app/verify-account/VerifyAccountPage.tsx",
    );
    assert(form.includes('type: "verification"'));
    assert(form.includes('status: "pending"'));
    assert(form.includes("uploadMedia"));
    assert(read("src/app/auth/permissions.ts").includes("verificationStatus"));
  },
);
check(
  "Permission defaults, staff audit links and workspace shortcuts exclude verification review",
  () => {
    for (const file of [
      "src/app/main/admins-app/Utils.ts",
      "src/app/main/home-app/Utils.ts",
      "src/app/main/dashboard/dashboard/DashboardContent.tsx",
      "src/app/configs/navigationConfig.ts",
    ])
      assert(!read(file).includes("verification-requests"), file);
  },
);
check(
  "Migration inventory retains historical areas and counts explicit exclusions accurately",
  () => {
    const ledger = JSON.parse(read("migration-status.json"));
    for (const feature of retired)
      assert.equal(
        ledger.features.find((row) => row.feature === feature).status,
        "excluded",
      );
    for (const status of ["migrated", "excluded", "partial", "pending"])
      assert.equal(
        ledger.counts[status],
        ledger.features.filter((row) => row.status === status).length,
      );
    assert.equal(
      Object.entries(ledger.counts)
        .filter(([key]) => key !== "featureAreas")
        .reduce((sum, [, value]) => sum + value, 0),
      ledger.counts.featureAreas,
    );
  },
);
console.log(`${passed}/${passed} feature-retirement checks passed.`);
