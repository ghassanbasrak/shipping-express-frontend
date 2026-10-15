import FuseUtils from "@fuse/utils";
import FuseLoading from "@fuse/core/FuseLoading";
import { Navigate } from "react-router-dom";
import settingsConfig from "app/configs/settingsConfig";
import { FuseRouteConfigsType, FuseRoutesType } from "@fuse/utils/FuseUtils";
import AuthAppConfigs from "../main/auth-app/AuthAppConfigs";
import CommonConfigs from "../main/common/CommonConfigs";

import HomeAppConfig from "../main/home-app/HomeAppConfig";

import CountriesAppConfig from "../main/countries-app/CountriesAppConfig";

import ShippingCompaniesAppConfig from "../main/shipping-companies-app/ShippingCompaniesAppConfig";

const routeConfigs: FuseRouteConfigsType = [
  ...CommonConfigs,
  ...AuthAppConfigs,
  HomeAppConfig,
  CountriesAppConfig,
  ShippingCompaniesAppConfig,
];

/**
 * The routes of the application.
 */
const routes: FuseRoutesType = [
  ...FuseUtils.generateRoutesFromConfigs(
    routeConfigs,
    settingsConfig.defaultAuth,
  ),
  {
    path: "/",
    element: <Navigate to="/home" replace />,
    auth: settingsConfig.defaultAuth,
  },
  {
    path: "loading",
    element: <FuseLoading />,
  },
  {
    path: "*",
    auth: null,
    element: <Navigate to="error/404" />,
  },
];

export default routes;
