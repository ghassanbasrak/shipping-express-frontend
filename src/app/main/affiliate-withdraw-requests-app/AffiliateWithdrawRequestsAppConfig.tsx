import { lazy } from "react";
import i18next from "i18next";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const AffiliateWithdrawRequest = lazy(
  () => import("./affiliate-withdraw-request/AffiliateWithdrawRequest"),
);
const AffiliateWithdrawRequests = lazy(
  () => import("./affiliate-withdraw-requests/AffiliateWithdrawRequests"),
);

i18next.addResourceBundle("en", "affiliateWithdrawRequestsApp", en);
i18next.addResourceBundle("ar", "affiliateWithdrawRequestsApp", ar);
i18next.addResourceBundle("tr", "affiliateWithdrawRequestsApp", tr);
const AffiliateWithdrawRequestsAppConfig: FuseRouteConfigType = {
  routes: [
    {
      path: "affiliate-withdraw-requests/:userId/:affiliateWithdrawRequestId/*",
      element: <AffiliateWithdrawRequest />,
      auth: authRoles.onlyUser,
    },
    {
      path: "affiliate-withdraw-requests/:userId",
      element: <AffiliateWithdrawRequests />,
      auth: authRoles.user,
    },
  ],
};
export default AffiliateWithdrawRequestsAppConfig;
