import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
const Page0 = lazy(() => import("./ForgotPasswordPage"));
const Page1 = lazy(() => import("./ResetCodeSentPage"));
const Page2 = lazy(() => import("./ResetPasswordPage"));
const ForgotPasswordConfig: FuseRouteConfigType = {
  auth: authRoles.onlyGuest,
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
    { path: "forgot-password", element: <Page0 /> },
    { path: "reset-code-sent", element: <Page1 /> },
    { path: "reset-password", element: <Page2 /> },
  ],
};
export default ForgotPasswordConfig;
