import FuseLayout from "@fuse/core/FuseLayout";
import FuseTheme from "@fuse/core/FuseTheme";
import { SnackbarProvider } from "notistack";
import "app/configs/apiConfig";
import rtlPlugin from "stylis-plugin-rtl";
import createCache, { Options } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import {
  selectCurrentLanguageDirection,
  selectCurrentLanguageId,
} from "app/store/i18nSlice";
import { useEffect } from "react";
import themeLayouts from "app/theme-layouts/themeLayouts";
import { selectMainTheme } from "@fuse/core/FuseSettings/fuseSettingsSlice";

import { useAppSelector } from "app/store/hooks";
import { useSelector } from "react-redux";
import withAppProviders from "./withAppProviders";
import AuthenticationProvider from "./auth/AuthenticationProvider";
import AppConfigProvider from "./AppConfigProvider";
import { LicenseInfo } from "@mui/x-license";
import { LocaleString } from "./main/utils/commonTypes";

/**
 * Axios HTTP Request defaults
 */

LicenseInfo.setLicenseKey(import.meta.env.VITE_X_MUI_LICENSE_KEY);
// axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
// axios.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';

const emotionCacheOptions = {
  rtl: {
    key: "muirtl",
    stylisPlugins: [rtlPlugin],
    insertionPoint: document.getElementById("emotion-insertion-point"),
    speedy: true,
  },
  ltr: {
    key: "muiltr",
    stylisPlugins: [],
    insertionPoint: document.getElementById("emotion-insertion-point"),
    speedy: true,
  },
};
const emotionCaches = {
  rtl: createCache(emotionCacheOptions.rtl as Options),
  ltr: createCache(emotionCacheOptions.ltr as Options),
};

/**
 * The main App component.
 */
function App() {
  /**
   * The language direction from the Redux store.
   */
  const langDirection = useAppSelector(selectCurrentLanguageDirection);
  const languageId = useAppSelector(selectCurrentLanguageId);

  useEffect(() => {
    document.documentElement.lang = languageId;
    document.documentElement.dir = langDirection;
  }, [languageId, langDirection]);

  /**
   * The main theme from the Redux store.
   */
  const mainTheme = useSelector(selectMainTheme);
  const html = document.getElementsByTagName("html")[0];
  html.style.fontSize = `${0.95 * 62.5}%`;
  return (
    <>
      <CacheProvider value={emotionCaches[langDirection === "rtl" ? "rtl" : "ltr"]}>
        <FuseTheme theme={mainTheme} direction={langDirection}>
          <AppConfigProvider>
            <AuthenticationProvider>
              <SnackbarProvider
                maxSnack={5}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                classes={{
                  containerRoot:
                    "bottom-0 right-0 mb-52 md:mb-68 mr-8 lg:mr-80 z-99",
                }}
              >
                <FuseLayout layouts={themeLayouts} />
              </SnackbarProvider>
            </AuthenticationProvider>
          </AppConfigProvider>
        </FuseTheme>
      </CacheProvider>
    </>
  );
}

export default withAppProviders(App);
