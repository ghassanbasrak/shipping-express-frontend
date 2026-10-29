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

import MerchantStatisticsAppConfig from "../main/merchant-statistics-app/MerchantStatisticsAppConfig";
import MerchantStatisticsNewAppConfig from "../main/merchant-statistics-new-app/MerchantStatisticsAppConfig";

import TransactionsAppConfig from "../main/transactions-app/TransactionsAppConfig";
import TransactionReportsAppConfig from "../main/transaction-reports-app/TransactionReportsAppConfig";

import ShipmentsAppConfig from "../main/shipments-app/ShipmentsAppConfig";

import CancelShipmentRequestsAppConfig from "../main/cancel-shipment-requests-app/CancelShipmentRequestsAppConfig";
import MerchantDuesAppConfig from "../main/merchant-dues-app/MerchantDuesAppConfig";

import WithdrawRequestsAppConfig from "../main/withdraw-requests-app/WithdrawRequestsAppConfig";
import LogsConfig from "../main/logs-app/LogsConfig";

import TopupRequestsAppConfig from "../main/topup-requests-app/TopupRequestsAppConfig";
import PaymentAppConfig from "../main/payment-app/PaymentAppConfig";
import MerchantsAppConfig from "../main/merchants-app/MerchantsAppConfig";
import AffiliateMerchantsAppConfig from "../main/affiliate-merchants-app/AffiliateMerchantsAppConfig";
import DashboardPageConfig from "../main/dashboard/DashboardPageConfig";
const routeConfigs: FuseRouteConfigsType = [
  DashboardPageConfig,
  AffiliateMerchantsAppConfig,
  ...CommonConfigs,
  ...AuthAppConfigs,
  HomeAppConfig,
  MerchantsAppConfig,
  TopupRequestsAppConfig,
  PaymentAppConfig,
  WithdrawRequestsAppConfig,
  LogsConfig,
  CancelShipmentRequestsAppConfig,
  MerchantDuesAppConfig,
  ShipmentsAppConfig,
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
