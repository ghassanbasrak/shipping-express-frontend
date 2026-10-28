import { lazy } from "react";
import i18next from "i18next";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
i18next.addResourceBundle("en", "merchantDuesApp", en);
i18next.addResourceBundle("ar", "merchantDuesApp", ar);
i18next.addResourceBundle("tr", "merchantDuesApp", tr);
const MerchantDues = lazy(() => import("./merchant-dues/MerchantDues"));
export default {
  settings: { layout: {} },
  routes: [
    {
      path: "merchant-dues/:shippingCompanyId/:userId",
      element: <MerchantDues />,
    },
  ],
};
