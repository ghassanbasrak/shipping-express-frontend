import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
const Home = lazy(() => import("./home/Home"));
const HomeAppConfig: FuseRouteConfigType = {
  routes: [{ path: "home", element: <Home /> }],
};
export default HomeAppConfig;
