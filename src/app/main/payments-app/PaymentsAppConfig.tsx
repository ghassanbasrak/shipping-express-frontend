import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
import { isDemoMode } from "src/app/demo/demoMode";
i18next.addResourceBundle("en", "paymentsApp", en);
i18next.addResourceBundle("ar", "paymentsApp", ar);
i18next.addResourceBundle("tr", "paymentsApp", tr);
const PaymentReturn = lazy(() => import("./PaymentReturn"));
const DemoPaymentCheckout = lazy(() => import("./DemoPaymentCheckout"));
const Payments = lazy(() => import("./payments/Payments")),
  Payment = lazy(() => import("./payment/Payment"));
export default {
  routes: [
    ...(isDemoMode
      ? [
          {
            path: "demo/payment/:paymentId",
            element: <DemoPaymentCheckout />,
            auth: authRoles.onlyUser,
          },
        ]
      : []),
    {
      path: "wallet/payment-result",
      element: <PaymentReturn />,
      auth: authRoles.onlyUser,
    },
    {
      path: "payments/:userId",
      element: <Payments />,
      auth: authRoles.user,
    },
    {
      path: "payments/:userId/:paymentId/*",
      element: <Payment />,
      auth: authRoles.onlyUser,
    },
  ],
};
