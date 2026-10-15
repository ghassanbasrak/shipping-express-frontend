import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
import i18next from "i18next";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const Countries = lazy(() => import("./countries/Countries"));
const Country = lazy(() => import("./country/Country"));
const CountryStates = lazy(() => import("./country/states/CountryStates"));
i18next.addResourceBundle("en", "countriesApp", en);
i18next.addResourceBundle("ar", "countriesApp", ar);
i18next.addResourceBundle("tr", "countriesApp", tr);
const CountriesAppConfig: FuseRouteConfigType = {
  auth: authRoles.admin,
  routes: [
    { path: "countries", element: <Navigate to="/countries/all" replace /> },
    { path: "countries/:shippingCompanyId", element: <Countries /> },
    { path: "countries/:shippingCompanyId/:countryId/*", element: <Country /> },
    // Preserve the country-to-states drilldown until states-app owns this route.
    {
      path: "states/:shippingCompanyId/:countryId",
      element: <CountryStates />,
    },
  ],
};
export default CountriesAppConfig;
