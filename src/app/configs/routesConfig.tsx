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

import StatesAppConfig from "../main/states-app/StatesAppConfig";
import CitiesAppConfig from "../main/cities-app/CitiesAppConfig";

import PlansAppConfig from "../main/plans-app/PlansAppConfig";
import AdminsAppConfig from "../main/admins-app/AdminsAppConfig";

import CouponsAppConfig from "../main/coupons-app/CouponsAppConfig";
import AlertsAppConfig from "../main/alerts-app/AlertsAppConfig";

import ShipmentUsersAppConfig from "../main/shipment-users-app/ShipmentUsersAppConfig";

import AuthRequestsAppConfig from "../main/auth-requests-app/AuthRequestsAppConfig";
import VerificationRequestsAppConfig from "../main/verification-requests-app/VerificationRequestsAppConfig";

import ApplicationsAppConfig from "../main/applications-app/ApplicationsAppConfig";

import BankTransfersAppConfig from "../main/bank-transfers-app/BankTransfersAppConfig";

import AffiliateWithdrawRequestsAppConfig from "../main/affiliate-withdraw-requests-app/AffiliateWithdrawRequestsAppConfig";

import PackageRequestsAppConfig from "../main/package-requests-app/PackageRequestsAppConfig";

import MerchantStatisticsAppConfig from "../main/merchant-statistics-app/MerchantStatisticsAppConfig";
import MerchantStatisticsNewAppConfig from "../main/merchant-statistics-new-app/MerchantStatisticsAppConfig";

import TransactionsAppConfig from "../main/transactions-app/TransactionsAppConfig";
import TransactionReportsAppConfig from "../main/transaction-reports-app/TransactionReportsAppConfig";

const routeConfigs: FuseRouteConfigsType = [
  ...CommonConfigs,
  ...AuthAppConfigs,
  HomeAppConfig,
  TransactionsAppConfig,
  TransactionReportsAppConfig,
  MerchantStatisticsAppConfig,
  MerchantStatisticsNewAppConfig,
  CountriesAppConfig,
  StatesAppConfig,
  CitiesAppConfig,
  ShippingCompaniesAppConfig,
  PlansAppConfig,
  AdminsAppConfig,
  CouponsAppConfig,
  AlertsAppConfig,
  ShipmentUsersAppConfig,
  ApplicationsAppConfig,
  BankTransfersAppConfig,
  PackageRequestsAppConfig,
  AffiliateWithdrawRequestsAppConfig,
  AuthRequestsAppConfig,
  VerificationRequestsAppConfig,
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
