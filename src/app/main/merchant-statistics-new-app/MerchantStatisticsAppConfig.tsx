import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import ar from "./i18n/ar";
import en from "./i18n/en";
import tr from "./i18n/tr";
i18next.addResourceBundle("en", "merchantStatisticsNewApp", en);
i18next.addResourceBundle("ar", "merchantStatisticsNewApp", ar);
i18next.addResourceBundle("tr", "merchantStatisticsNewApp", tr);
const MerchantStatistics = lazy(
  () => import("./merchant-statistics/MerchantStatistics"),
);
const MerchantStatisticsAppConfig = {
  settings: { layout: {} },
  routes: [
    {
      path: "merchant-statistics-new",
      element: <MerchantStatistics />,
      auth: authRoles.staff,
    },
  ],
};
export default MerchantStatisticsAppConfig;
