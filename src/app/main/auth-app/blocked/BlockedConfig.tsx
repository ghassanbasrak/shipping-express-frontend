import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
const Page0 = lazy(() => import("./BlockedPage"));
const BlockedConfig: FuseRouteConfigType = {
  auth: authRoles.user,
  settings: {
    layout: {
      config: {
        navbar: { display: false },
        toolbar: { display: false },
        footer: { display: false },
        leftSidePanel: { display: false },
        rightSidePanel: { display: false },
      },
    },
  },
  routes: [{ path: "blocked", element: <Page0 /> }],
};
export default BlockedConfig;
