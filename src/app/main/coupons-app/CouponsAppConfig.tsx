import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import i18next from "i18next";
import authRoles from "src/app/auth/authRoles";
import en from "./i18n/en";
import ar from "./i18n/ar";
import tr from "./i18n/tr";
const Coupons = lazy(() => import("./coupons/Coupons"));
const Coupon = lazy(() => import("./coupon/Coupon"));
i18next.addResourceBundle("en", "couponsApp", en);
i18next.addResourceBundle("ar", "couponsApp", ar);
i18next.addResourceBundle("tr", "couponsApp", tr);
const CouponsAppConfig: FuseRouteConfigType = {
  auth: authRoles.staff,
  routes: [
    { path: "coupons/:shippingCompanyId/:userId", element: <Coupons /> },
    {
      path: "coupons/:shippingCompanyId/:userId/:couponId/*",
      element: <Coupon />,
    },
  ],
};
export default CouponsAppConfig;
