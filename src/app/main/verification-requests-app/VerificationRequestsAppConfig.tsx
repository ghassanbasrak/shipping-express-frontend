import { lazy } from "react";
import i18next from "i18next";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const VerificationRequests = lazy(
  () => import("./verification-requests/VerificationRequests"),
);

i18next.addResourceBundle("en", "verificationRequestsApp", en);
i18next.addResourceBundle("ar", "verificationRequestsApp", ar);
i18next.addResourceBundle("tr", "verificationRequestsApp", tr);
const VerificationRequestsAppConfig: FuseRouteConfigType = {
  routes: [
    {
      path: "verification-requests/:userId",
      element: <VerificationRequests />,
      auth: authRoles.staff,
    },
  ],
};
export default VerificationRequestsAppConfig;
