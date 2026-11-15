import { lazy } from "react";
import type { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
const Subscriptions = lazy(
  () => import("./subscriptions/StorageSubscriptions"),
);
const SubscribeStorage = lazy(() => import("./SubscribeStorage"));
const Result = lazy(() => import("../payments-app/PaymentReturn"));
const config: FuseRouteConfigType = {
  auth: ["admin", "user"],
  routes: [
    { path: "storage", element: <SubscribeStorage /> },
    { path: "storage/subscribe", element: <SubscribeStorage /> },
    { path: "storage/subscriptions", element: <Subscriptions /> },
    { path: "storage/payment-result", element: <Result /> },
  ],
};
export default config;
