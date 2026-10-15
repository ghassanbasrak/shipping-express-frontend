import { lazy } from "react";
import { FuseRouteConfigType } from "@fuse/utils/FuseUtils";
import { Navigate } from "react-router-dom";
import Error401Page from "./Error401Page";

const Error404Page = lazy(() => import("./Error404Page"));
const Error500Page = lazy(() => import("./Error500Page"));

import ar from "./i18n/ar";
import en from "./i18n/en";
import i18next from "i18next";

i18next.addResourceBundle("en", "error", en);
i18next.addResourceBundle("ar", "error", ar);

const ErrorConfig: FuseRouteConfigType = {
  auth: null,
  settings: {
    layout: {
      config: {},
    },
  },
  routes: [
    {
      path: "error",
      children: [
        {
          path: "",
          element: <Navigate to="404" />,
        },
        {
          path: "401",
          element: <Error401Page />,
        },
        {
          path: "404",
          element: <Error404Page />,
        },
        {
          path: "500",
          element: <Error500Page />,
        },
      ],
    },
  ],
};

export default ErrorConfig;
