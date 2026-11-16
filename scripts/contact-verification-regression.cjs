const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("../node_modules/typescript");
const axios = require("../node_modules/axios/dist/node/axios.cjs");
const MockAdapter = require("../node_modules/axios-mock-adapter");
const base = "src/app/auth/services/jwt/";
function load(file, imports) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    {
      exports,
      URL,
      require: (name) => {
        if (name in imports) return imports[name];
        throw Error(name);
      },
    },
  );
  return exports;
}
const config = load(base + "jwtAuthConfig.ts", {}).default;
const helpers = load(base + "contactVerification.ts", {});
const account = {
  id: "owner",
  role: "user",
  isRegistered: true,
  email: "old@example.test",
  phone: "+966-555123456",
  emailVerified: false,
  phoneVerified: false,
  firstName: "Test",
  lastName: "User",
  companyName: "Company",
  address: {
    countryId: "sa",
    stateId: "state",
    cityId: "city",
    street: "Keep this street",
    zipCode: "12345",
  },
  balance: 1000,
};
function fixture() {
  const client = axios.create(),
    mock = new MockAdapter(client),
    state = [],
    sessions = [];
  let index = 0;
  const jsx = (type, props) => ({ type, props });
  const React = {
    createContext: () => ({ Provider: () => {} }),
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useEffect: () => {},
    useRef: (value) => ({ current: value }),
    useState: (initial) => {
      const key = index++;
      state[key] =
        key === 0 ? { ...account } : key === 1 ? "authenticated" : initial;
      return [
        state[key],
        (next) => {
          state[key] = typeof next === "function" ? next(state[key]) : next;
        },
      ];
    },
  };
  const Provider = load(base + "JwtAuthProvider.tsx", {
    react: React,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "app/configs/apiConfig": { default: client, __esModule: true },
    axios: { isAxiosError: axios.isAxiosError },
    "./jwtAuthConfig": { default: config, __esModule: true },
    "./session": {
      getAccessToken: () => null,
      getRefreshToken: () => null,
      installAuthInterceptors: () => () => {},
      setSession: (...args) => sessions.push(args),
    },
    "app/store/hooks": { useAppDispatch: () => () => {} },
    "app/store/apiService": {
      default: { util: { resetApiState: () => ({}) } },
      __esModule: true,
    },
    "@fuse/core/FuseDialog/fuseDialogSlice": { closeDialog: () => ({}) },
    "../../user/store/userSlice": { resetUser: () => ({}) },
    "src/app/demo/demoMode": { isDemoMode: false, getDemoUser: () => account },
    "./contactVerification": helpers,
  }).default;
  return {
    auth: Provider({ children: null }).props.value,
    client,
    mock,
    state,
    sessions,
  };
}
let passed = 0;
async function test(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
(async () => {
  await test("zero challenge IDs are accepted, while missing/malformed IDs fail", () => {
    assert.equal(helpers.otpChallengeId(0), "0");
    for (const value of [undefined, null, "", {}, "abc", -1, Infinity])
      assert.throws(() => helpers.otpChallengeId(value));
  });
  await test("phone send uses authenticated endpoint and reads current server flags", async () => {
    const f = fixture();
    f.mock.onPost(config.sendPhoneVerificationCode).reply((c) => {
      assert.deepEqual(JSON.parse(c.data), { phone: account.phone });
      return [200, { msegatId: 0 }];
    });
    f.mock.onGet(config.accessToken).reply(200, account);
    assert.equal(await f.auth.sendPhoneVerificationCode(account.phone), "0");
    assert.equal(f.mock.history.patch.length, 0);
    assert.equal(f.sessions.length, 0);
  });
  await test("phone code login retains zero-ID test challenge support", async () => {
    const f = fixture();
    f.mock.onPost(config.sendOtpCode).reply(200, { msegatId: 0 });
    assert.equal(await f.auth.sendOtpCode(account.phone), "0");
  });
  await test("valid phone contact verification re-reads ownership and never replaces login tokens", async () => {
    const f = fixture();
    f.mock.onPost(config.verifyOtpCode).reply((c) => {
      assert.deepEqual(JSON.parse(c.data), {
        phone: account.phone,
        code: "12345",
        msegatId: 0,
      });
      return [
        200,
        {
          isVerified: true,
          user: { ...account, phoneVerified: true },
          accessToken: "unexpected-token",
        },
      ];
    });
    f.mock
      .onGet(config.accessToken)
      .reply(200, { ...account, phoneVerified: true });
    const result = await f.auth.linkWithPhoneNumber(
      account.phone,
      "12345",
      "0",
    );
    assert.equal(result.phoneVerified, true);
    assert.equal(f.sessions.length, 0);
  });
  await test("wrong or expired codes cannot grant verification", async () => {
    const f = fixture();
    f.mock.onPost(config.verifyOtpCode).reply(200, { isVerified: false });
    await assert.rejects(
      f.auth.linkWithPhoneNumber(account.phone, "0000", "1"),
    );
    assert.equal(f.mock.history.get.length, 0);
    assert.equal(f.state[0].phoneVerified, false);
  });
  await test("another account returned by public phone verification is rejected", async () => {
    const f = fixture();
    f.mock
      .onPost(config.verifyOtpCode)
      .reply(200, { isVerified: true, user: { ...account, id: "other" } });
    await assert.rejects(
      f.auth.linkWithPhoneNumber(account.phone, "1234", "1"),
    );
    assert.equal(f.sessions.length, 0);
    assert.equal(f.mock.history.get.length, 0);
  });
  await test("success flag alone cannot override unverified or mismatched current phone", async () => {
    for (const current of [
      { ...account, phoneVerified: false },
      { ...account, phoneVerified: true, phone: "+966-999999999" },
    ]) {
      const f = fixture();
      f.mock
        .onPost(config.verifyOtpCode)
        .reply(200, { isVerified: true, user: account });
      f.mock.onGet(config.accessToken).reply(200, current);
      await assert.rejects(
        f.auth.linkWithPhoneNumber(account.phone, "1234", "1"),
      );
      assert.equal(f.state[0].phoneVerified, false);
    }
  });
  await test("email changes preserve profile/address and send no verification or financial flags", async () => {
    const f = fixture();
    f.mock.onGet(config.accessToken).reply(200, account);
    f.mock.onPatch(config.updateUser).reply((c) => {
      const data = JSON.parse(c.data);
      assert.equal(data.email, "new@example.test");
      assert.deepEqual(data.address, account.address);
      for (const key of [
        "id",
        "role",
        "balance",
        "emailVerified",
        "phoneVerified",
      ])
        assert.equal(data[key], undefined);
      return [200, { ...account, email: data.email }];
    });
    f.mock.onPost(config.sendEmailVerificationCode).reply((c) => {
      assert.deepEqual(JSON.parse(c.data), { email: "new@example.test" });
      return [200, {}];
    });
    await f.auth.sendEmailVerificationCode("New@Example.Test");
    assert.equal(f.state[0].email, "new@example.test");
  });
  await test("unchanged email only sends the code and skips profile mutation", async () => {
    const f = fixture();
    f.mock.onGet(config.accessToken).reply(200, account);
    f.mock.onPost(config.sendEmailVerificationCode).reply(200, {});
    await f.auth.sendEmailVerificationCode(account.email);
    assert.equal(f.mock.history.patch.length, 0);
  });
  await test("email verification requires matching current account, email and server verification flag", async () => {
    for (const current of [
      { ...account, emailVerified: true },
      { ...account, emailVerified: false },
      { ...account, emailVerified: true, email: "other@example.test" },
    ]) {
      const f = fixture();
      f.mock.onPost(config.verifyEmailCode).reply((c) => {
        assert.deepEqual(JSON.parse(c.data), {
          email: account.email,
          code: "123456",
        });
        return [200, { isVerified: true, user: account }];
      });
      f.mock.onGet(config.accessToken).reply(200, current);
      const result = f.auth.linkWithEmail(account.email, "123456");
      if (current.emailVerified && current.email === account.email)
        assert.equal((await result).emailVerified, true);
      else await assert.rejects(result);
    }
  });
  await test("a refresh failure keeps verification unavailable", async () => {
    const f = fixture();
    f.mock
      .onPost(config.verifyEmailCode)
      .reply(200, { isVerified: true, user: account });
    f.mock.onGet(config.accessToken).reply(503, {});
    await assert.rejects(f.auth.linkWithEmail(account.email, "123456"));
    assert.equal(f.state[0].emailVerified, false);
  });
  await test("late verification after logout cannot restore the account or issue a new session", async () => {
    const f = fixture();
    let release;
    f.mock.onPost(config.verifyEmailCode).reply(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const promise = f.auth.linkWithEmail(account.email, "123456");
    f.auth.signOut();
    release([200, { isVerified: true, user: account }]);
    await assert.rejects(promise);
    assert.equal(f.state[0], null);
    assert.equal(f.sessions.length, 1);
    assert.equal(f.sessions[0][0], null);
  });
  console.log(`${passed}/${passed} contact verification checks passed.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
