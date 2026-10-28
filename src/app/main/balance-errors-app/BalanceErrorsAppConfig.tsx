import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
i18next.addResourceBundle("en", "balanceErrorsApp", en);
i18next.addResourceBundle("ar", "balanceErrorsApp", ar);
const BalanceDuplicationErrors = lazy(
  () => import("./balance-errors/BalanceDuplicationErrors"),
);
export default {
  auth: authRoles.staff,
  settings: { layout: {} },
  routes: [
    {
      path: "balance-duplication-errors",
      element: <BalanceDuplicationErrors />,
    },
  ],
};
