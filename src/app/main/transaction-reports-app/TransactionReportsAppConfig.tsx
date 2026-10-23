import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import ar from "./i18n/ar";
import en from "./i18n/en";
import tr from "./i18n/tr";
i18next.addResourceBundle("en", "transactionReportsApp", en);
i18next.addResourceBundle("ar", "transactionReportsApp", ar);
i18next.addResourceBundle("tr", "transactionReportsApp", tr);
const TransactionReports = lazy(
  () => import("./transaction-reports/TransactionReports"),
);
const TransactionReportsAppConfig = {
  settings: { layout: {} },
  routes: [
    { path: "transaction-reports/:userId", element: <TransactionReports /> },
  ],
};
export default TransactionReportsAppConfig;
