import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import i18next from "i18next";
import MagicLinkPage from "./MagicLinkPage";
import MagicLinkSentPage from "./MagicLinkSentPage";
import en from "./i18n/en";
import ar from "./i18n/ar";
import { authRoles } from "src/app/auth";
i18next.addResourceBundle("en", "magicLink", en);
i18next.addResourceBundle("ar", "magicLink", ar);

const MagicLinkConfig: FuseRouteConfigType = {
  settings: {
    layout: {
      config: {
        navbar: {
          display: false,
        },
        toolbar: {
          display: false,
        },
        footer: {
          display: false,
        },
        leftSidePanel: {
          display: false,
        },
        rightSidePanel: {
          display: false,
        },
      },
    },
  },
  auth: authRoles.onlyGuest,
  routes: [
    {
      path: "magic-link-sent",
      element: <MagicLinkSentPage />,
    },
    {
      path: "magic-link",
      element: <MagicLinkPage />,
    },
  ],
};

export default MagicLinkConfig;
