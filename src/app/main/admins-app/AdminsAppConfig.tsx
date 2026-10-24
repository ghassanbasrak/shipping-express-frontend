import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const Admins = lazy(() => import("./admins/Admins"));
const Admin = lazy(() => import("./admin/Admin"));
i18next.addResourceBundle("en", "adminsApp", en);
i18next.addResourceBundle("ar", "adminsApp", ar);
i18next.addResourceBundle("tr", "adminsApp", tr);
const AdminsAppConfig: FuseRouteConfigType = {
  auth: authRoles.staff,
  routes: [
    { path: "admins", element: <Admins /> },
    { path: "admins/:adminId/*", element: <Admin /> },
  ],
};
export default AdminsAppConfig;
