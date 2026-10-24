import { lazy } from "react";
import i18next from "i18next";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const AuthRequests = lazy(() => import("./auth-requests/AuthRequests"));
const AuthRequest = lazy(() => import("./auth-request/AuthRequest"));
i18next.addResourceBundle("en", "authRequestsApp", en);
i18next.addResourceBundle("ar", "authRequestsApp", ar);
i18next.addResourceBundle("tr", "authRequestsApp", tr);
const AuthRequestsAppConfig: FuseRouteConfigType = {
  routes: [
    {
      path: "auth-requests/:userId",
      element: <AuthRequests />,
      auth: authRoles.user,
    },
    {
      path: "auth-requests/:userId/:authRequestId/*",
      element: <AuthRequest />,
      auth: authRoles.onlyUser,
    },
  ],
};
export default AuthRequestsAppConfig;
