import { lazy } from "react";
import i18next from "i18next";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const WithdrawRequest = lazy(
  () => import("./withdraw-request/WithdrawRequest"),
);
const WithdrawRequests = lazy(
  () => import("./withdraw-requests/WithdrawRequests"),
);

i18next.addResourceBundle("en", "withdrawRequestsApp", en);
i18next.addResourceBundle("ar", "withdrawRequestsApp", ar);
i18next.addResourceBundle("tr", "withdrawRequestsApp", tr);
const WithdrawRequestsAppConfig: FuseRouteConfigType = {
  routes: [
    {
      path: "withdraw-requests/:userId/:withdrawRequestId/*",
      element: <WithdrawRequest />,
      auth: authRoles.onlyUser,
    },
    {
      path: "withdraw-requests/:userId",
      element: <WithdrawRequests />,
      auth: authRoles.user,
    },
  ],
};
export default WithdrawRequestsAppConfig;
