import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import authRoles from "src/app/auth/authRoles";
const Page0 = lazy(() => import("./OtpCodeSentPage"));
const OtpCodeSentConfig: FuseRouteConfigType = {
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
  routes: [{ path: "otp-code-sent/:phone", element: <Page0 /> }],
};
export default OtpCodeSentConfig;
