import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";

const ShippingCompanies = lazy(
  () => import("./shipping-companies/ShippingCompanies"),
);
const ShippingCompany = lazy(
  () => import("./shipping-company/ShippingCompany"),
);
i18next.addResourceBundle("en", "shippingCompaniesApp", en);
i18next.addResourceBundle("ar", "shippingCompaniesApp", ar);
i18next.addResourceBundle("tr", "shippingCompaniesApp", tr);

const ShippingCompaniesAppConfig: FuseRouteConfigType = {
  auth: authRoles.staff,
  routes: [
    { path: "shipping-companies", element: <ShippingCompanies /> },
    {
      path: "shipping-companies/:shippingCompanyId/*",
      element: <ShippingCompany />,
    },
  ],
};
export default ShippingCompaniesAppConfig;
