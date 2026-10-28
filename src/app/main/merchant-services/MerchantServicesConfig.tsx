import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
i18next.addResourceBundle("en", "merchantServices", en);
i18next.addResourceBundle("ar", "merchantServices", ar);
const StoreAuthentication = lazy(() => import("./StoreAuthentication")),
  StoreIntegration = lazy(() => import("./StoreIntegration")),
  NewStore = lazy(() => import("./NewStore"));
export default {
  auth: authRoles.user,
  settings: { layout: {} },
  routes: [
    { path: "store-authentication", element: <StoreAuthentication /> },
    { path: "store-integration", element: <StoreIntegration /> },
    { path: "new-store", element: <NewStore /> },
  ],
};
