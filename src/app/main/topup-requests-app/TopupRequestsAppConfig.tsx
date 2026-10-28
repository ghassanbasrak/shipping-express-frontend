import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
i18next.addResourceBundle("en", "topupRequestsApp", en);
i18next.addResourceBundle("ar", "topupRequestsApp", ar);
i18next.addResourceBundle("tr", "topupRequestsApp", tr);
const TopupRequests = lazy(() => import("./topup-requests/TopupRequests")),
  TopupRequest = lazy(() => import("./topup-request/TopupRequest"));
export default {
  routes: [
    {
      path: "topup-requests/:userId",
      element: <TopupRequests />,
      auth: authRoles.user,
    },
    {
      path: "topup-requests/:userId/:topupRequestId/*",
      element: <TopupRequest />,
      auth: authRoles.onlyUser,
    },
  ],
};
