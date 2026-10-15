import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
const Page0 = lazy(() => import("./SignOutPage"));
const SignOutConfig: FuseRouteConfigType = {
  auth: null,
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
  routes: [
    { path: "sign-out", element: <Page0 /> },
    { path: "logout", element: <Page0 /> },
  ],
};
export default SignOutConfig;
