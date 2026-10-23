import { lazy } from "react";
import i18next from "i18next";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
const Applications = lazy(() => import("./applications/Applications"));
const Application = lazy(() => import("./application/Application"));
i18next.addResourceBundle("en", "applicationsApp", en);
i18next.addResourceBundle("ar", "applicationsApp", ar);
const ApplicationsAppConfig: FuseRouteConfigType = {
  auth: authRoles.staff,
  routes: [
    {
      path: "applications",
      children: [
        { path: "", element: <Applications /> },
        { path: ":applicationId/*", element: <Application /> },
      ],
    },
  ],
};
export default ApplicationsAppConfig;
