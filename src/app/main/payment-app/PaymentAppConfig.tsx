import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
i18next.addResourceBundle("en", "paymentApp", en);
i18next.addResourceBundle("ar", "paymentApp", ar);
i18next.addResourceBundle("tr", "paymentApp", tr);
const PaymentPage = lazy(() => import("./PaymentPage"));
export default {
  settings: {
    layout: {
      config: {
        navbar: { display: false },
        toolbar: { display: false },
        footer: { display: false },
        leftSidePanel: { display: false },
        rightSidePanel: { display: false },
      },
    },
  },
  auth: authRoles.onlyUser,
  routes: [
    {
      path: "payment/:userId/:topupRequestId/:result",
      element: <PaymentPage />,
    },
  ],
};
