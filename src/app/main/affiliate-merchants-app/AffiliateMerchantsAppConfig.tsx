import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const AffiliateMerchants = lazy(
  () => import("./affiliate-merchants/AffiliateMerchants"),
);
const AffiliateMerchant = lazy(
  () => import("./affiliate-merchant/AffiliateMerchant"),
);
for (const [language, locale] of Object.entries({ en, ar, tr }))
  i18next.addResourceBundle(language, "affiliateMerchantsApp", locale);
export default {
  settings: { layout: {} },
  routes: [
    {
      path: "affiliate-merchants",
      element: <AffiliateMerchants />,
      auth: authRoles.staff,
    },
    {
      path: "affiliate-merchants/:affiliateMerchantId",
      element: <AffiliateMerchant />,
      auth: authRoles.staff,
    },
    {
      path: "affiliate-merchants/:affiliateMerchantId/:tab",
      element: <AffiliateMerchant />,
      auth: authRoles.staff,
    },
    {
      path: "affiliate-profile",
      element: <AffiliateMerchant />,
      auth: authRoles.onlyUser,
    },
    {
      path: "affiliate-profile/:tab",
      element: <AffiliateMerchant />,
      auth: authRoles.onlyUser,
    },
  ],
};
