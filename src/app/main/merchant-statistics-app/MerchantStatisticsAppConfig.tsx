import { lazy } from "react";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import ar from "./i18n/ar";
import en from "./i18n/en";
import tr from "./i18n/tr";
i18next.addResourceBundle("en", "merchantStatisticsApp", en);
i18next.addResourceBundle("ar", "merchantStatisticsApp", ar);
i18next.addResourceBundle("tr", "merchantStatisticsApp", tr);
const MerchantStatistics = lazy(
  () => import("./merchant-statistics/MerchantStatistics"),
);
const MerchantStatisticsAppConfig = {
  settings: { layout: {} },
  routes: [
    {
      path: "merchant-statistics",
      element: <MerchantStatistics />,
      auth: authRoles.staff,
    },
  ],
};
export default MerchantStatisticsAppConfig;
