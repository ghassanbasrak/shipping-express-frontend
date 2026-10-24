import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const Plans = lazy(() => import("./plans/Plans"));
const Plan = lazy(() => import("./plan/Plan"));
i18next.addResourceBundle("en", "plansApp", en);
i18next.addResourceBundle("ar", "plansApp", ar);
i18next.addResourceBundle("tr", "plansApp", tr);
const PlansAppConfig: FuseRouteConfigType = {
  auth: authRoles.staff,
  routes: [
    { path: "plans", element: <Plans /> },
    { path: "plans/:planId/*", element: <Plan /> },
  ],
};
export default PlansAppConfig;
