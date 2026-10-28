import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
i18next.addResourceBundle("en", "merchantsApp", en);
i18next.addResourceBundle("ar", "merchantsApp", ar);
i18next.addResourceBundle("tr", "merchantsApp", tr);
const Merchants = lazy(() => import("./merchants/Merchants")),
  Merchant = lazy(() => import("./merchant/Merchant"));
export default {
  routes: [
    { path: "merchants", element: <Merchants />, auth: authRoles.staff },
    {
      path: "merchants/:merchantId",
      element: <Merchant />,
      auth: authRoles.staff,
    },
    {
      path: "merchants/:merchantId/view",
      element: <Merchant forView />,
      auth: authRoles.staff,
    },
    {
      path: "profile",
      element: <Merchant forView />,
      auth: authRoles.onlyUser,
    },
    { path: "edit-profile", element: <Merchant />, auth: authRoles.onlyUser },
  ],
};
