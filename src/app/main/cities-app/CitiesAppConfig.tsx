import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
import i18next from "i18next";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const Cities = lazy(() => import("./cities/Cities"));
const City = lazy(() => import("./city/City"));
i18next.addResourceBundle("en", "citiesApp", en);
i18next.addResourceBundle("ar", "citiesApp", ar);
i18next.addResourceBundle("tr", "citiesApp", tr);
const CitiesAppConfig: FuseRouteConfigType = {
  auth: authRoles.admin,
  routes: [
    { path: "cities", element: <Navigate to="/cities/all/all" replace /> },
    { path: "cities/:shippingCompanyId/:stateId", element: <Cities /> },
    { path: "cities/:shippingCompanyId/:stateId/:cityId/*", element: <City /> },
  ],
};
export default CitiesAppConfig;
