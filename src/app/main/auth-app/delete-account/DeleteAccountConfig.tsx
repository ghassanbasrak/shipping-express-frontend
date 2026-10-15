import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
const Page0 = lazy(() => import("./DeleteAccountPage"));
const DeleteAccountConfig: FuseRouteConfigType = {
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
    { path: "delete-account", element: <Page0 /> },
    { path: "delete-my-account", element: <Page0 /> },
  ],
};
export default DeleteAccountConfig;
