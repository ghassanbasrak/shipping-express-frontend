import { lazy } from "react";
import i18next from "i18next";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
i18next.addResourceBundle("en", "cancelShipmentRequestsApp", en);
i18next.addResourceBundle("ar", "cancelShipmentRequestsApp", ar);
i18next.addResourceBundle("tr", "cancelShipmentRequestsApp", tr);
const CancelShipmentRequests = lazy(
  () => import("./cancel-shipment-requests/CancelShipmentRequests"),
);
export default {
  settings: { layout: {} },
  routes: [
    {
      path: "cancel-shipment-requests/:userId",
      element: <CancelShipmentRequests />,
    },
  ],
};
