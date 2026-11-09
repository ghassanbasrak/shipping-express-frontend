import { lazy } from "react";
import i18next from "i18next";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import en from "./i18n/en";
import ar from "./i18n/ar";
const StorageHome = lazy(() => import("./StorageHome"));
const StorageList = lazy(() => import("./lists/StorageList"));
const Warehouse = lazy(() => import("./warehouse/Warehouse"));
const StoragePlan = lazy(() => import("./plan/StoragePlan"));
const SupplyRequest = lazy(() => import("./supply/SupplyRequest"));
const StoragePaymentResult = lazy(() => import("./StoragePaymentResult"));
i18next.addResourceBundle("en", "storageApp", en);
i18next.addResourceBundle("ar", "storageApp", ar);
const StorageAppConfig: FuseRouteConfigType = {
  auth: ["admin", "user"],
  routes: [
    { path: "storage", element: <StorageHome /> },
    { path: "storage/payment-result", element: <StoragePaymentResult /> },
    { path: "wallet/payment-result", element: <StoragePaymentResult /> },
    { path: "storage/warehouses", element: <StorageList kind="warehouses" /> },
    { path: "storage/warehouses/:warehouseId/*", element: <Warehouse /> },
    { path: "storage/plans", element: <StorageList kind="plans" /> },
    { path: "storage/plans/:planId/*", element: <StoragePlan /> },
    { path: "storage/products", element: <StorageList kind="products" /> },
    {
      path: "storage/supply-requests",
      element: <StorageList kind="supplies" />,
    },
    {
      path: "storage/supply-requests/:supplyRequestId/*",
      element: <SupplyRequest />,
    },
  ],
};
export default StorageAppConfig;
