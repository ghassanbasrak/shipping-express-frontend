import i18next from "i18next";
import { FuseNavItemType } from "@fuse/core/FuseNavigation/types/FuseNavItemType";
import ar from "./navigation-i18n/ar";
import en from "./navigation-i18n/en";

i18next.addResourceBundle("en", "navigation", en);
i18next.addResourceBundle("ar", "navigation", ar);

import authRoles from "src/app/auth/authRoles";

const navigationConfig: FuseNavItemType[] = [
  {
    id: "shipping-companies",
    title: "Shipping Companies",
    translate: "SHIPPING_COMPANIES",
    type: "item",
    icon: "heroicons-outline:truck",
    url: "/shipping-companies",
    auth: authRoles.staff,
  },
  {
    id: "countries",
    title: "Countries",
    translate: "COUNTRIES",
    type: "item",
    icon: "heroicons-outline:globe-alt",
    url: "/countries/all",
    auth: authRoles.admin,
  },
  {
    id: "dashboard",
    title: "Dashboard",
    type: "item",
    customIcon: true,
    icon: "fa6-FaGaugeHigh",
    url: "/home",
    translate: "DASHBOARD",
  },
];
export default navigationConfig;
