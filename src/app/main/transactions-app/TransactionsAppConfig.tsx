import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import ar from "./i18n/ar";
import en from "./i18n/en";
import tr from "./i18n/tr";
i18next.addResourceBundle("en", "transactionsApp", en);
i18next.addResourceBundle("ar", "transactionsApp", ar);
i18next.addResourceBundle("tr", "transactionsApp", tr);
const Transactions = lazy(() => import("./transactions/Transactions"));
const Transaction = lazy(() => import("./transaction/Transaction"));
const TransactionsAppConfig = {
  settings: { layout: {} },
  routes: [
    { path: "transactions/:userId/:relatedBalance", element: <Transactions /> },
    {
      path: "transactions/:userId/:relatedBalance/:transactionId/*",
      element: <Transaction />,
      auth: authRoles.staff,
    },
  ],
};
export default TransactionsAppConfig;
