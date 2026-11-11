import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
i18next.addResourceBundle("en", "dashboard", en);
i18next.addResourceBundle("ar", "dashboard", ar);
const DashboardPage = lazy(() => import("./DashboardPage"));
export default {
  auth: authRoles.admin,
  settings: { layout: {} },
  routes: [{ path: "dashboard", element: <DashboardPage /> }],
};
