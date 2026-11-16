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
  const source = fs.readFileSync(path.join(root, file), "utf8").replace(/import\.meta\.env/g, "({})");
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
test("Logout clears local credentials immediately without a backend request", () => {
  const f = fixture();
  f.session.setSession(null);
  assert.equal(f.session.getAccessToken(), null);
  assert.equal(f.session.getRefreshToken(), null);
  assert.equal(f.client.defaults.headers.common.Authorization, undefined);
  assert.equal(f.mock.history.post.length, 0);
  f.remove();
});

test("Repeated local logout removes legacy credentials and preserves preferences", () => {
  const f = fixture();
  for (const key of ["access_token", "refresh_token", "fcm_token"])
    f.storage.set(key, "legacy");
  f.storage.set("my-language", "ar");
  f.session.setSession(null);
  f.session.setSession(null);
  assert.equal(f.session.getAccessToken(), null);
  assert.equal(f.session.getRefreshToken(), null);
  for (const key of ["access_token", "refresh_token", "fcm_token"])
    assert.equal(f.storage.has(key), false);
  assert.equal(f.storage.get("my-language"), "ar");
  assert.equal(f.mock.history.post.length, 0);
  assert.equal(f.signouts(), 0);
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
test("Customer contact verification gates preserve registration, blocking and retired merchant-review independence", () => {
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
    "/verify-contacts",
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
    "/verify-contacts",
  );
  for (const phoneVerified of [undefined, false, true])
    for (const emailVerified of [undefined, false, true])
      assert.equal(p.accountDestination({role:"user",isRegistered:true,phoneVerified,emailVerified}),
        phoneVerified === true && emailVerified === true ? "/home" : "/verify-contacts");
  for (const verificationStatus of ["pending", "rejected", "expired"])
    assert.equal(p.accountDestination({role:"user",isRegistered:true,phoneVerified:true,emailVerified:true,verificationStatus}),"/home");
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
test("Authenticated pages wait for their matching Redux account; logout stays available", () => {
  let storedUser = null;
  let pathname = "/home";
  const account = { id: "merchant-1", role: "user" };
  const auth = { user: account, authStatus: "authenticated" };
  const noop = () => {};
  const Splash = () => {};
  const SignOut = () => {};
  const Authorization = () => {};
  const jsx = (type, props) => ({ type, props });
  const component = load("src/app/auth/Authentication.tsx", {
    react: { useEffect: noop },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-router-dom": { useLocation: () => ({ pathname }) },
    "@fuse/core/BrowserRouter": { default: noop, __esModule: true },
    "@fuse/core/FuseAuthorization/FuseAuthorization": { default: Authorization, __esModule: true },
    "@fuse/core/FuseSplashScreen": { default: Splash, __esModule: true },
    "@mui/material": {},
    "react-i18next": { useTranslation: () => ({ t: key => key }) },
    "app/store/hooks": { useAppDispatch: () => noop, useAppSelector: () => storedUser },
    "./user/store/userSlice": { setUser: noop, resetUser: noop, selectUser: noop },
    "./services/jwt/useJwtAuth": { default: () => auth, __esModule: true },
    "./useAuth": { default: () => ({ setAuthProvider: noop, resetAuthProvider: noop, setIsAuthenticated: noop }), __esModule: true },
    "./services/firebase/FirebaseMessagingApp": { default: noop, __esModule: true },
    "../main/auth-app/sign-out/SignOutPage": { default: SignOut, __esModule: true },
  }).default;
  const render = () => {
    const content = component({ children: "protected page" }).props.children;
    return content.type(content.props);
  };
  assert.equal(render().type, Splash, "null Redux account blocks page mount");
  storedUser = { ...account, id: "previous-account" };
  assert.equal(render().type, Splash, "previous account blocks page mount");
  storedUser = { ...account, role: "admin" };
  assert.equal(render().type, Splash, "previous role blocks page mount");
  storedUser = account;
  assert.equal(render().props.children[1].type, Authorization);
  assert.equal(render().props.children[1].props.children, "protected page");
  auth.user = null;
  assert.equal(render().type, Splash, "missing auth account blocks page mount");
  auth.authStatus = "configuring";
  for (pathname of ["/sign-out", "/logout"])
    assert.equal(render().type, SignOut, "logout bypasses readiness loading");
});

test("Route boundary blocks customer pages until contact verification without merchant approval", () => {
  const permissions = load("src/app/auth/permissions.ts", {});
  let pathname = "/payments/all";
  const noop = () => {};
  const Navigate = () => {};
  const authorization = load("src/@fuse/core/FuseAuthorization/FuseAuthorization.tsx", {
    "react/jsx-runtime": {jsx: (type, props) => ({type, props})},
    react: {useContext: () => ({routes: []})},
    "react-router-dom": {Navigate, useLocation: () => ({pathname,search:"",hash:""}),matchRoutes: () => [{route:{auth:["user"]}}]},
    "app/AppContext": {default:{},__esModule:true},
    "@fuse/utils/FuseUtils": {default:{hasPermission:()=>true},__esModule:true},
    "src/app/auth/permissions": permissions,
    "./sessionRedirectUrl": {getSessionRedirectUrl:noop,resetSessionRedirectUrl:noop,setSessionRedirectUrl:noop},
  }).default;
  const user = {id:"owner",role:"user",isRegistered:true,phoneVerified:false,emailVerified:false};
  assert.equal(authorization({user,children:"feature"}).props.to,"/verify-contacts");
  pathname = "/verify-contacts";
  assert.equal(authorization({user,children:"verification"}),"verification");
  pathname = "/payments/all";
  assert.equal(authorization({user:{...user,phoneVerified:true,emailVerified:true,verificationStatus:"rejected"},children:"feature"}),"feature");
  assert.equal(authorization({user:{...user,isBlocked:true},children:"feature"}).props.to,"/blocked");
  assert.equal(authorization({user:{...user,isRegistered:false},children:"feature"}).props.to,"/register");
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
