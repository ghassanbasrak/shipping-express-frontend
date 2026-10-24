import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
const Alerts = lazy(() => import("./alerts/Alerts"));
const Alert = lazy(() => import("./alert/Alert"));
i18next.addResourceBundle("en", "alertsApp", en);
i18next.addResourceBundle("ar", "alertsApp", ar);
const AlertsAppConfig: FuseRouteConfigType = {
  auth: authRoles.staff,
  routes: [
    { path: "alerts", element: <Alerts /> },
    { path: "alerts/:alertId/*", element: <Alert /> },
  ],
};
export default AlertsAppConfig;
