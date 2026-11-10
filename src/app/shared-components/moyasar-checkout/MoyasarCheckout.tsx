import "./checkout.css";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { isDemoMode } from "src/app/demo/demoMode";
export type MoyasarFormConfig = {
  publishable_api_key: string;
  amount: number;
  currency: "SAR";
  description: string;
  callback_url: string;
  methods: ["creditcard"];
};
type FormConfig = MoyasarFormConfig;
type MoyasarWindow = Window & {
  Moyasar?: {
    init: (
      config: FormConfig & {
        element: HTMLElement;
        fixed_width: boolean;
        language: string;
        on_completed: (payment: { id: string }) => Promise<void>;
      },
    ) => void;
  };
};
let loading: Promise<void> | undefined;
function loadForm() {
  if ((window as MoyasarWindow).Moyasar) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href =
      "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.3.0/dist/moyasar.css";
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.3.0/dist/moyasar.umd.min.js";
    script.async = true;
    const timer = setTimeout(fail, 20000);
    function fail() {
      clearTimeout(timer);
      script.remove();
      css.remove();
      loading = undefined;
      reject(new Error("checkout"));
    }
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timer);
      if (!(window as MoyasarWindow).Moyasar) {
        fail();
        return;
      }
      resolve();
    };
    document.head.append(css, script);
  });
  return loading;
}
export default function MoyasarCheckout({
  checkout,
  paymentId,
  onPaymentCreated,
  demoReturnPath = "/storage/payment-result",
  testId = "moyasar-storage-form",
}: {
  checkout: FormConfig;
  demoReturnPath?: string;
  testId?: string;
  paymentId: string;
  onPaymentCreated: (id: string) => void | Promise<void>;
}) {
  const host = useRef<HTMLDivElement>(null),
    { t, i18n } = useTranslation("storageApp"),
    [error, setError] = useState(false),
    [ready, setReady] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (isDemoMode) return;
    let active = true;
    setError(false);
    setReady(false);
    loadForm()
      .then(() => {
        if (!active || !host.current) return;
        const element = document.createElement("div");
        host.current.replaceChildren(element);
        (window as MoyasarWindow).Moyasar.init({
          ...checkout,
          element,
          fixed_width: false,
          language: i18n.language === "ar" ? "ar" : "en",
          on_completed: async (payment) => {
            await onPaymentCreated(payment.id);
          },
        });
        setReady(true);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      host.current?.replaceChildren();
    };
  }, [checkout, paymentId, attempt, i18n.language]);
  if (isDemoMode)
    return (
      <Alert
        severity="info"
        action={
          <Button
            data-testid="demo-storage-pay"
            onClick={() => {
              const id = "demo-moyasar-" + paymentId;
              onPaymentCreated(id);
              window.location.assign(
                demoReturnPath +
                  "?paymentId=" +
                  encodeURIComponent(paymentId) +
                  "&id=" +
                  encodeURIComponent(id),
              );
            }}
          >
            {t("DEMO_PAY")}
          </Button>
        }
      >
        {t("DEMO_CHECKOUT")}
      </Alert>
    );
  return (
    <div className="space-y-16">
      {!ready && !error && (
        <div role="status" className="flex items-center gap-12">
          <CircularProgress size={20} />
          <Typography>{t("LOADING_CHECKOUT")}</Typography>
        </div>
      )}
      {error && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => setAttempt((value) => value + 1)}>
              {t("RETRY")}
            </Button>
          }
        >
          {t("CHECKOUT_LOAD_ERROR")}
        </Alert>
      )}
      <div className="ashamco-payment-form" ref={host} data-testid={testId} />
    </div>
  );
}
