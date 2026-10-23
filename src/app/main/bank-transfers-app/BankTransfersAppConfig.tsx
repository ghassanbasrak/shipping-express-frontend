import { lazy } from "react";
import i18next from "i18next";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const BankTransfers = lazy(() => import("./bank-transfers/BankTransfers"));

i18next.addResourceBundle("en", "bankTransfersApp", en);
i18next.addResourceBundle("ar", "bankTransfersApp", ar);
i18next.addResourceBundle("tr", "bankTransfersApp", tr);
const BankTransfersAppConfig: FuseRouteConfigType = {
  routes: [
    {
      path: "bank-transfers/:userId",
      element: <BankTransfers />,
      auth: authRoles.user,
    },
  ],
};
export default BankTransfersAppConfig;
