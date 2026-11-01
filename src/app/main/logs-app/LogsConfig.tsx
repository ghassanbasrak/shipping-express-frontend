import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
i18next.addResourceBundle("en", "logsApp", en);
i18next.addResourceBundle("ar", "logsApp", ar);
i18next.addResourceBundle("tr", "logsApp", tr);
const Logs = lazy(() => import("./logs/Logs")),
  Log = lazy(() => import("./log/Log"));
export default {
  auth: authRoles.admin,
  routes: [
    { path: "logs", element: <Logs /> },
    { path: "logs/:logId", element: <Log /> },
  ],
};
