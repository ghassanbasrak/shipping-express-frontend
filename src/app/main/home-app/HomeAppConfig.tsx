import i18next from "i18next";
import en from "./i18n/en";
import ar from "./i18n/ar";
i18next.addResourceBundle("en", "homeApp", en);
i18next.addResourceBundle("ar", "homeApp", ar);
import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
const Home = lazy(() => import("./home/Home"));
const HomeAppConfig: FuseRouteConfigType = {
  routes: [{ path: "home", element: <Home /> }],
};
export default HomeAppConfig;
