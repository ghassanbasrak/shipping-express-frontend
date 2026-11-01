import { lazy } from "react";
import i18next from "i18next";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
i18next.addResourceBundle("en", "shipmentsApp", en);
i18next.addResourceBundle("ar", "shipmentsApp", ar);
i18next.addResourceBundle("tr", "shipmentsApp", tr);
const Shipments = lazy(() => import("./shipments/Shipments")),
  Shipment = lazy(() => import("./shipment/Shipment")),
  ShippingCalculator = lazy(
    () => import("./shipping-calculator/ShippingCalculator"),
  );
export default {
  settings: { layout: {} },
  routes: [
    {
      path: "shipments/:shippingCompanyId/:shippingType",
      element: <Shipments />,
    },
    {
      path: "shipments/:shippingCompanyId/:shippingType/:shipmentId/*",
      element: <Shipment />,
    },
    { path: "shipping-price-calculator", element: <ShippingCalculator /> },
  ],
};
