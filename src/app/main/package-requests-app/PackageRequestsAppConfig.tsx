import { lazy } from "react";
import i18next from "i18next";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const PackageRequest = lazy(() => import("./package-request/PackageRequest"));
const PackageRequests = lazy(
  () => import("./package-requests/PackageRequests"),
);

i18next.addResourceBundle("en", "packageRequestsApp", en);
i18next.addResourceBundle("ar", "packageRequestsApp", ar);
i18next.addResourceBundle("tr", "packageRequestsApp", tr);
const PackageRequestsAppConfig: FuseRouteConfigType = {
  routes: [
    {
      path: "package-requests/:userId/:packageRequestId/*",
      element: <PackageRequest />,
      auth: authRoles.user,
    },
    {
      path: "package-requests/:userId",
      element: <PackageRequests />,
      auth: authRoles.user,
    },
  ],
};
export default PackageRequestsAppConfig;
