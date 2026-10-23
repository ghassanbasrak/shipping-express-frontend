import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const ShipmentUsersApp = lazy(() => import("./ShipmentUsersApp"));
const ShipmentUser = lazy(() => import("./shipment-user/ShipmentUser"));
i18next.addResourceBundle("en", "shipmentUsersApp", en);
i18next.addResourceBundle("ar", "shipmentUsersApp", ar);
i18next.addResourceBundle("tr", "shipmentUsersApp", tr);
const ShipmentUsersAppConfig: FuseRouteConfigType = {
  auth: authRoles.user,
  routes: [
    {
      path: "shipment-users/:type",
      element: <ShipmentUsersApp />,
      children: [{ path: ":shipmentUserId", element: <ShipmentUser /> }],
    },
  ],
};
export default ShipmentUsersAppConfig;
