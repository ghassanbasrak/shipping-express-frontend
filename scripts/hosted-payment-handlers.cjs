const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const jsx = require("react/jsx-runtime");
function load(file, imports, globals = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    {
      exports,
      URL,
      ...globals,
      require: (name) => {
        if (name === "react/jsx-runtime") return jsx;
        if (!(name in imports)) throw new Error("Unexpected import " + name);
        return imports[name];
      },
    },
  );
  return exports;
}
const utils = load("src/app/main/payments-app/Utils.ts", {
  "src/app/auth/permissions": { hasOperationPermission: () => true },
  "../transactions-app/Utils": { availableTransactionBalances: () => [] },
});
const moduleDefault = (value) => ({ __esModule: true, default: value });
const actor = { id: "owner", role: "user" };
const record = {
  id: "internal",
  userId: actor.id,
  type: utils.paymentType.topup,
  status: utils.paymentStatus.pending,
  amount: 100,
  total: 115,
  taxTotal: 15,
};
function harness(file, imports = {}, globals = {}) {
  let cursor = 0,
    tree;
  const slots = [],
    effects = [];
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots))
        slots[i] = typeof initial === "function" ? initial() : initial;
      return [
        slots[i],
        (next) => {
          slots[i] = typeof next === "function" ? next(slots[i]) : next;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      return (slots[i] ||= { current: initial });
    },
    useEffect(effect, deps) {
      const i = cursor++;
      if (
        !slots[i] ||
        deps.some((value, index) => value !== slots[i].deps[index])
      ) {
        const previous = slots[i];
        effects.push(() => {
          previous?.cleanup?.();
          slots[i] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const common = {
    react: hooks,
    "@mui/material": Object.fromEntries(
      ["Alert", "Button", "Chip", "Paper", "Typography"].map((name) => [
        name,
        name,
      ]),
    ),
    "@mui/lab": { LoadingButton: "Submit" },
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "app/store/hooks": { useAppSelector: () => actor },
    "src/app/auth/user/store/userSlice": { selectUser() {} },
    "src/app/demo/demoMode": { isDemoMode: false },
    "@fuse/hooks/useThemeMediaQuery": moduleDefault(() => false),
    "@fuse/core/FusePageCarded": moduleDefault("Page"),
    "@fuse/core/FuseLoading": moduleDefault("Loading"),
    "../../utils/currencyFormatter": moduleDefault((value) => String(value)),
    "../../../utils/currencyFormatter": moduleDefault((value) => String(value)),
    "../Utils": utils,
    "../../Utils": utils,
    ...imports,
  };
  const component = load(file, common, globals).default;
  const render = (props) => {
    cursor = 0;
    tree = component(props);
    for (const effect of effects.splice(0)) effect();
    return tree;
  };
  function all(node = tree) {
    if (!node || typeof node !== "object") return [];
    return [
      node,
      ...[node.props?.children, node.props?.content, node.props?.submit]
        .flat(Infinity)
        .filter((value) => value && typeof value === "object")
        .flatMap((value) => all(value)),
    ];
  }
  return {
    render,
    all,
    async settle(props) {
      for (let n = 0; n < 10; n++) await Promise.resolve();
      render(props);
    },
    unmount() {
      for (const item of slots) item?.cleanup?.();
    },
  };
}
function wallet(response) {
  const redirects = [],
    writes = [];
  let values,
    route = "first";
  const form = {
    reset: (next) => {
      values = next;
    },
    watch: (name) => values[name],
    setValue: (name, value) => {
      values[name] = value;
    },
    handleSubmit: (callback) => () => callback(values),
  };
  const h = harness(
    "src/app/main/payments-app/payment/Payment.tsx",
    {
      "react-hook-form": {
        FormProvider: "Provider",
        useForm: (options) => {
          values ||= options.defaultValues;
          return form;
        },
      },
      "@hookform/resolvers/zod": { zodResolver() {} },
      "react-router-dom": {
        Link: "Link",
        Navigate: "Navigate",
        useParams: () => ({ paymentId: "new" }),
        useSearchParams: () => [new URLSearchParams()],
        useNavigate: () => () => {},
        useLocation: () => ({ key: route }),
      },
      "../PaymentsApi": {
        useCreatePaymentMutation: () => [
          (body) => ({
            unwrap: async () => {
              writes.push(body);
              return typeof response === "function" ? response() : response;
            },
          }),
          {},
        ],
      },
      "../../bank-transfers-app/BankTransfersApi": {
        useCreateBankTransferMutation: () => [() => {}, {}],
      },
      "../models/PaymentSchema": { paymentSchema() {} },
      "./PaymentHeader": moduleDefault("Header"),
      "./tabs/BasicInfoTab": moduleDefault("Info"),
      "./tabs/PaymentResultTab": moduleDefault("Result"),
    },
    {
      URLSearchParams,
      window: {
        location: {
          origin: "http://localhost:3000",
          assign: (value) => redirects.push(value),
        },
      },
    },
  );
  h.render();
  h.render();
  return {
    ...h,
    redirects,
    writes,
    submit() {
      values = {
        ...values,
        amount: 115,
        method: utils.paymentFundingMethod.online,
      };
      return h
        .all()
        .find((node) => node.type === "Submit")
        .props.onClick();
    },
    fresh() {
      route = "fresh";
      h.render();
      h.render();
    },
  };
}
function result(options = {}) {
  let reads = 0,
    refreshes = 0;
  const checks = [],
    settings = {
      stored: record,
      verified: {
        ...record,
        status: utils.paymentStatus.confirmed,
        paymentMethodType: utils.paymentMethodType.mada,
      },
      ...options,
    };
  const h = harness(
    "src/app/main/payments-app/payment/tabs/PaymentResultTab.tsx",
    {
      "react-router-dom": { Link: "Link" },
      "src/app/auth/services/jwt/useJwtAuth": moduleDefault(() => ({
        getUser: async () => {
          refreshes++;
        },
      })),
      "../../PaymentsApi": {
        useLazyGetPaymentQuery: () => [
          () => ({
            unwrap: async () => {
              reads++;
              return settings.stored;
            },
          }),
        ],
        useCheckPaymentStatusMutation: () => [
          (body) => ({
            unwrap: async () => {
              checks.push(body);
              return settings.verified;
            },
          }),
        ],
      },
      "../../../storage-subscriptions-app/StoragePaymentResult":
        moduleDefault("StorageResult"),
    },
  );
  return {
    ...h,
    checks,
    settings,
    get reads() {
      return reads;
    },
    get refreshes() {
      return refreshes;
    },
  };
}
let passed = 0;
async function check(title, test) {
  await test();
  passed++;
  console.log("PASS " + title);
}
(async () => {
  await check(
    "Wallet redirects to the returned hosted URL and locks repeated submissions",
    async () => {
      const h = wallet({
        payment: record,
        checkoutUrl: "https://checkout.moyasar.com/invoices/invoice",
      });
      const first = h.submit(),
        duplicate = h.submit();
      await Promise.all([first, duplicate]);
      h.render();
      assert.equal(h.writes.length, 1);
      assert.equal(h.writes[0].amount, 100);
      assert.deepEqual(h.redirects, [
        "https://checkout.moyasar.com/invoices/invoice",
      ]);
      assert(!h.all().some((node) => node.type === "Info"));
    },
  );
  await check(
    "Missing hosted URL keeps the created payment locked and never falls back to an embedded form",
    async () => {
      const h = wallet({
        payment: record,
        checkout: { publishable_api_key: "old" },
      });
      await h.submit();
      h.render();
      assert.equal(h.redirects.length, 0);
      assert.equal(h.writes.length, 1);
      assert(
        h
          .all()
          .some(
            (node) =>
              node.type === "Alert" &&
              node.props.children === "HOSTED_CHECKOUT_UNAVAILABLE",
          ),
      );
      assert(!h.all().some((node) => node.type === "Info"));
    },
  );
  await check(
    "Foreign or wrong-purpose create responses cannot redirect the customer",
    async () => {
      for (const payment of [
        { ...record, userId: "other" },
        { ...record, type: utils.paymentType.storageSubscription },
      ]) {
        const h = wallet({
          payment,
          checkoutUrl: "https://checkout.moyasar.com/invoices/invoice",
        });
        await h.submit();
        h.render();
        assert.equal(h.redirects.length, 0);
        assert(h.all().find((node) => node.type === "Info").props.disabled);
      }
    },
  );
  await check(
    "A delayed checkout from a previous page cannot redirect a fresh payment form",
    async () => {
      let resolve;
      const h = wallet(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      );
      const task = h.submit();
      h.fresh();
      resolve({
        payment: record,
        checkoutUrl: "https://checkout.moyasar.com/invoices/invoice",
      });
      await task;
      h.render();
      assert.equal(h.redirects.length, 0);
      assert(h.all().some((node) => node.type === "Info"));
    },
  );
  await check(
    "Wallet return verifies using only the internal ID without a provider ID",
    async () => {
      const h = result();
      h.render({ id: record.id });
      await h.settle({ id: record.id });
      assert.equal(h.reads, 1);
      assert.equal(h.checks.length, 1);
      assert.equal(h.checks[0].id, record.id);
      assert.equal(h.checks[0].moyasarPaymentId, undefined);
      assert(h.all().some((node) => node.props?.children === "PAYMENT_DONE"));
      assert.equal(h.refreshes, 1);
    },
  );
  await check(
    "Missing internal ID cannot trigger a payment lookup or verification",
    async () => {
      const h = result();
      h.render({ id: null });
      await h.settle({ id: null });
      assert.equal(h.reads, 0);
      assert.equal(h.checks.length, 0);
    },
  );
  await check(
    "Foreign records and unknown purposes cannot reach payment verification",
    async () => {
      for (const stored of [
        { ...record, userId: "other" },
        { ...record, type: undefined },
      ]) {
        const h = result({ stored });
        h.render({ id: record.id });
        await h.settle({ id: record.id });
        assert.equal(h.checks.length, 0);
      }
    },
  );
  await check(
    "Stored purpose routes a storage result to entitlement verification",
    async () => {
      const h = result({
        stored: { ...record, type: utils.paymentType.storageSubscription },
      });
      h.render({ id: record.id });
      await h.settle({ id: record.id });
      assert.equal(h.checks.length, 0);
      assert(
        h
          .all()
          .some(
            (node) =>
              node.type === "StorageResult" &&
              node.props.paymentId === record.id,
          ),
      );
    },
  );
  await check(
    "Pending result stays pending and can be refreshed to a verified success",
    async () => {
      const h = result({ verified: record });
      h.render({ id: record.id });
      await h.settle({ id: record.id });
      assert(
        h.all().some((node) => node.props?.children === "PAYMENT_PENDING"),
      );
      assert.equal(h.refreshes, 0);
      h.settings.verified = {
        ...record,
        status: utils.paymentStatus.confirmed,
      };
      h.all()
        .find(
          (node) =>
            node.type === "Button" &&
            node.props.children === "RETRY_PAYMENT_CHECK",
        )
        .props.onClick();
      h.render({ id: record.id });
      await h.settle({ id: record.id });
      assert.equal(h.checks.length, 2);
      assert.equal(h.refreshes, 1);
    },
  );
  await check(
    "Verification cannot substitute another account or payment purpose",
    async () => {
      const h = result({
        verified: {
          ...record,
          userId: "other",
          status: utils.paymentStatus.confirmed,
        },
      });
      h.render({ id: record.id });
      await h.settle({ id: record.id });
      assert.equal(h.refreshes, 0);
      assert(h.all().some((node) => node.type === "Alert"));
    },
  );
  await check(
    "A failed invoice renders failure and never reports wallet credit",
    async () => {
      const h = result({
        verified: { ...record, status: utils.paymentStatus.refused },
      });
      h.render({ id: record.id });
      await h.settle({ id: record.id });
      assert.equal(h.refreshes, 0);
      assert(
        h
          .all()
          .some(
            (node) =>
              node.props?.children === "THE_CHECKOUT_PROCESS_HAS_FAILED",
          ),
      );
      assert(
        h
          .all()
          .some(
            (node) => node.type === "Alert" && node.props.severity === "error",
          ),
      );
    },
  );
  function storageResult(overrides = {}) {
    const settings = {
      payment: {
        ...record,
        type: utils.paymentType.storageSubscription,
        status: utils.paymentStatus.confirmed,
      },
      subscription: {
        userId: actor.id,
        status: "active",
        paymentId: record.id,
      },
      ...overrides,
    };
    const checks = [];
    const h = harness(
      "src/app/main/storage-subscriptions-app/StoragePaymentResult.tsx",
      {
        "@mui/material": Object.fromEntries(
          [
            "Alert",
            "Button",
            "Chip",
            "Paper",
            "Typography",
            "CircularProgress",
          ].map((name) => [name, name]),
        ),
        "react-router-dom": {
          Link: "Link",
          useSearchParams: () => [new URLSearchParams()],
        },
        "./StorageSubscriptionsApi": {
          useVerifyStoragePaymentMutation: () => [
            (value) => ({
              unwrap: async () => {
                checks.push(value);
                return settings.payment;
              },
            }),
          ],
          useGetStorageSubscriptionQuery: () => ({
            currentData: settings.subscription,
            isError: false,
            isFetching: false,
            refetch: async () => settings.subscription,
          }),
        },
        "../storage-app/Utils": {
          hasActiveStorageSubscription: (value, userId) =>
            value?.userId === userId && value?.status === "active",
          storageError: (error) => error.message,
        },
        "../payments-app/Utils": utils,
        "../storage-app/shared/StorageGate": moduleDefault("StorageGate"),
      },
      { URLSearchParams },
    );
    return { ...h, checks };
  }
  await check(
    "Storage return verifies the internal ID and requires its matching entitlement",
    async () => {
      const h = storageResult();
      h.render({ paymentId: record.id });
      await h.settle({ paymentId: record.id });
      assert.equal(h.checks.length, 1);
      assert.equal(h.checks[0].paymentId, record.id);
      assert.equal(h.checks[0].moyasarPaymentId, undefined);
      assert(
        h.all().some((node) => node.props?.children === "SUBSCRIPTION_SUCCESS"),
      );
    },
  );
  await check(
    "An unrelated active subscription cannot satisfy this payment result",
    async () => {
      const h = storageResult({
        subscription: {
          userId: actor.id,
          status: "active",
          paymentId: "other-payment",
        },
      });
      h.render({ paymentId: record.id });
      await h.settle({ paymentId: record.id });
      assert(
        !h
          .all()
          .some((node) => node.props?.children === "SUBSCRIPTION_SUCCESS"),
      );
      assert(
        h.all().some((node) => node.props?.children === "SUBSCRIPTION_REFRESH"),
      );
    },
  );
  await check(
    "Storage pending result is informational and cannot claim activation",
    async () => {
      const h = storageResult({
        payment: { ...record, type: utils.paymentType.storageSubscription },
      });
      h.render({ paymentId: record.id });
      await h.settle({ paymentId: record.id });
      assert(
        h
          .all()
          .some(
            (node) => node.type === "Alert" && node.props.severity === "info",
          ),
      );
      assert(
        !h
          .all()
          .some((node) => node.props?.children === "SUBSCRIPTION_SUCCESS"),
      );
    },
  );
  await check(
    "Wallet-purpose records cannot be accepted by storage verification",
    async () => {
      const h = storageResult({
        payment: { ...record, status: utils.paymentStatus.confirmed },
      });
      h.render({ paymentId: record.id });
      await h.settle({ paymentId: record.id });
      assert(
        !h
          .all()
          .some((node) => node.props?.children === "SUBSCRIPTION_SUCCESS"),
      );
      assert(
        h
          .all()
          .some(
            (node) => node.type === "Alert" && node.props.severity === "error",
          ),
      );
    },
  );
  console.log(passed + "/" + passed + " hosted-handler checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
