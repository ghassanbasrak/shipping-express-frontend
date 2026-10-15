const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const target = path.resolve(__dirname, "..");
const ts = require(path.join(target, "node_modules/typescript"));
const axios = require(
  path.join(target, "node_modules/axios/dist/node/axios.cjs"),
);
const MockAdapter = require(
  path.join(target, "node_modules/axios-mock-adapter"),
);
const zod = require(path.join(target, "node_modules/zod"));
const root = target;
function load(file, imports, globals = {}) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(
    js,
    {
      exports,
      require: (name) => {
        if (name in imports) return imports[name];
        if (name === "axios") return axios;
        if (name === "zod") return zod;
        if (name === "react/jsx-runtime") return {};
        throw new Error(`Unexpected import ${name}`);
      },
      URL,
      Date,
      console,
      ...globals,
    },
    { filename: file },
  );
  return exports;
}
function fixture() {
  const client = axios.create({ baseURL: "https://ashamco.test" });
  const storage = new Map();
  let signouts = 0;
  const session = load(
    "src/app/auth/services/jwt/session.ts",
    {
      "app/configs/apiConfig": {
        __esModule: true,
        default: client,
        API_BASE_URL: "https://ashamco.test",
      },
      "./jwtAuthConfig": {
        __esModule: true,
        default: load("src/app/auth/services/jwt/jwtAuthConfig.ts", {}).default,
      },
    },
    {
      window: { location: { origin: "http://localhost:3000" } },
      localStorage: {
        getItem: (k) => storage.get(k) || null,
        setItem: (k, v) => storage.set(k, v),
        removeItem: (k) => storage.delete(k),
      },
    },
  );
  const remove = session.installAuthInterceptors(() => {
    signouts++;
    session.setSession(null);
  });
  session.setSession("old", "refresh");
  return {
    client,
    session,
    storage,
    mock: new MockAdapter(client),
    remove,
    signouts: () => signouts,
  };
}
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
test("Concurrent expired requests refresh once and rotate both tokens", async () => {
  const f = fixture();
  let refreshes = 0;
  f.mock
    .onGet("v1/data")
    .reply((config) => [
      config.headers.Authorization === "Bearer fresh" ? 200 : 401,
      { ok: true },
    ]);
  f.mock.onPost("v1/auth-sessions/refresh").reply(() => {
    refreshes++;
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve([
            201,
            {
              accessToken: { token: "fresh" },
              refreshToken: { token: "rotated" },
            },
          ]),
        15,
      ),
    );
  });
  const results = await Promise.all(
    Array.from({ length: 8 }, () => f.client.get("v1/data")),
  );
  assert.equal(refreshes, 1);
  assert.equal(results.length, 8);
  assert.equal(f.session.getRefreshToken(), "rotated");
  assert.equal(f.signouts(), 0);
  f.remove();
});
test("Binary response configuration survives refresh retries", async () => {
  const f = fixture();
  let type;
  f.mock.onGet("v1/document").reply((config) => {
    type = config.responseType;
    return [config.headers.Authorization === "Bearer fresh" ? 200 : 401, "PDF"];
  });
  f.mock
    .onPost("v1/auth-sessions/refresh")
    .reply(200, { accessToken: "fresh" });
  await f.client.get("v1/document", { responseType: "arraybuffer" });
  assert.equal(type, "arraybuffer");
  f.remove();
});
test("External presigned uploads strip app credentials and never refresh", async () => {
  const f = fixture();
  let headers;
  f.mock.onPost("https://storage.test/upload").reply((config) => {
    headers = config.headers;
    return [401, {}];
  });
  await assert.rejects(
    f.client.post("https://storage.test/upload", {}, { baseURL: "/" }),
  );
  assert.equal(headers.Authorization, undefined);
  assert.equal(f.signouts(), 0);
  assert.equal(f.mock.history.post.length, 1);
  f.remove();
});
test("Network failures do not crash interceptors or clear the session", async () => {
  const f = fixture();
  f.mock.onGet("v1/data").networkError();
  await assert.rejects(f.client.get("v1/data"));
  assert.equal(f.signouts(), 0);
  assert.equal(f.session.getAccessToken(), "old");
  f.remove();
});
test("Invalid credentials do not trigger token refresh", async () => {
  const f = fixture();
  f.mock.onPost("v1/auth-sessions/login").reply(401, {});
  await assert.rejects(f.client.post("v1/auth-sessions/login", {}));
  assert.equal(f.signouts(), 0);
  assert.equal(f.mock.history.post.length, 1);
  f.remove();
});
test("Expired refresh credentials clear the session without retry loops", async () => {
  const f = fixture();
  f.mock.onGet("v1/data").reply(401, {});
  f.mock.onPost("v1/auth-sessions/refresh").reply(401, {});
  await assert.rejects(f.client.get("v1/data"));
  assert.equal(f.session.getAccessToken(), null);
  assert.equal(f.mock.history.post.length, 1);
  f.remove();
});
test("Logging out during refresh cannot restore credentials", async () => {
  const f = fixture();
  f.mock.onGet("v1/data").reply(401, {});
  f.mock
    .onPost("v1/auth-sessions/refresh")
    .reply(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve([200, { accessToken: "fresh" }]), 30),
        ),
    );
  const request = f.client.get("v1/data");
  setTimeout(() => f.session.setSession(null), 5);
  await assert.rejects(request);
  assert.equal(f.session.getAccessToken(), null);
  f.remove();
});
test("Interceptor cleanup allows safe provider remounting", async () => {
  const f = fixture();
  f.remove();
  assert.equal(
    f.client.interceptors.response.handlers.filter(Boolean).length,
    0,
  );
  assert.equal(
    f.client.interceptors.request.handlers.filter(Boolean).length,
    0,
  );
});
test("Ashamco registration, blocking and merchant verification gates", () => {
  const p = load("src/app/auth/permissions.ts", {});
  assert.equal(p.accountDestination(null), "/sign-in");
  assert.equal(
    p.accountDestination({ role: "user", isRegistered: false }),
    "/register",
  );
  assert.equal(
    p.accountDestination({
      role: "user",
      isRegistered: false,
      isBlocked: true,
    }),
    "/blocked",
  );
  assert.equal(
    p.accountDestination({ role: "user", isRegistered: true }),
    "/verify-account",
  );
  assert.equal(
    p.accountDestination({ role: "employee", isRegistered: true }),
    "/home",
  );
  assert.equal(
    p.accountDestination({
      role: "user",
      isRegistered: true,
      verificationStatus: "approved",
    }),
    "/home",
  );
});
test("Employee feature permissions and wallet/COD route mappings", () => {
  const p = load("src/app/auth/permissions.ts", {});
  const user = {
    role: "employee",
    features: [
      { feature: "transactions", accessView: true, accessCreate: false },
      { feature: "merchants", accessView: true, accessUpdate: true },
    ],
  };
  assert.equal(p.hasPagePermission("/transactions/123/wallet", user), true);
  assert.equal(
    p.hasPagePermission("/transactions/123/wallet/new", user),
    false,
  );
  assert.equal(p.hasOperationPermission("merchants", "update", user), true);
  assert.equal(p.hasOperationPermission("merchants", "delete", user), false);
  assert.equal(p.hasPagePermission("/shipments/all", user), false);
  assert.equal(p.hasOperationPermission("merchants", "view", null), false);
});
test("Affiliate restrictions remain scoped to merchant accounts", () => {
  const p = load("src/app/auth/permissions.ts", {});
  assert.equal(
    p.hasPagePermission("/affiliate-withdraw-requests/123", { role: "user" }),
    false,
  );
  assert.equal(
    p.hasPagePermission("/affiliate-withdraw-requests/123", {
      role: "user",
      isAffiliate: true,
    }),
    true,
  );
});
test("Auth endpoints preserve original backend paths", () => {
  const config = load("src/app/auth/services/jwt/jwtAuthConfig.ts", {}).default;
  assert.equal(config.signInWithEmailAndPassword, "v1/auth-sessions/login");
  assert.equal(config.sendOtpCode, "v1/users/send-codes");
  assert.equal(config.verifyResetCode, "v1/users/reset-password");
});
(async () => {
  let failures = 0;
  for (const [name, run] of tests) {
    try {
      await run();
      console.log(`PASS ${name}`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${name}: ${error.stack}`);
    }
  }
  console.log(
    `${tests.length - failures}/${tests.length} regression checks passed`,
  );
  process.exitCode = failures ? 1 : 0;
})();
