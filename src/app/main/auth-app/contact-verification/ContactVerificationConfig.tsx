import { lazy } from "react";
import type { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
const Page = lazy(() => import("./ContactVerificationPage"));
const config: FuseRouteConfigType = {
  auth: authRoles.onlyUser,
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
  routes: [{ path: "verify-contacts", element: <Page /> }],
};
export default config;
