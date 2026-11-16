import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import SignOutPage from "./SignOutPage";
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
    { path: "sign-out", element: <SignOutPage /> },
    { path: "logout", element: <SignOutPage /> },
  ],
};
export default SignOutConfig;
