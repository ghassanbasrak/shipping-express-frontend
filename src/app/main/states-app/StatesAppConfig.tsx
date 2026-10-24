import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
import i18next from "i18next";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const States = lazy(() => import("./states/States"));
const State = lazy(() => import("./state/State"));
i18next.addResourceBundle("en", "statesApp", en);
i18next.addResourceBundle("ar", "statesApp", ar);
i18next.addResourceBundle("tr", "statesApp", tr);
const StatesAppConfig: FuseRouteConfigType = {
  auth: authRoles.admin,
  routes: [
    { path: "states", element: <Navigate to="/states/all/all" replace /> },
    { path: "states/:shippingCompanyId/:countryId", element: <States /> },
    {
      path: "states/:shippingCompanyId/:countryId/:stateId/*",
      element: <State />,
    },
  ],
};
export default StatesAppConfig;
