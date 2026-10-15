import { createContext, useEffect } from "react";
// import { selectFuseCurrentSettings } from "./store/fuse/settingsSlice";
import { useSelector } from "react-redux";
import i18n from "src/i18n";
import { defaultThemeOptions } from "@fuse/default-settings";
import { selectFuseCurrentSettings } from "@fuse/core/FuseSettings/fuseSettingsSlice";

export const AppConfigContext = createContext({});

function AppConfigProvider({ children }) {
  const settings = useSelector(selectFuseCurrentSettings);
  // useEffect(() => {
  //   dispatch(getSettings()).then((action) => {
  //     const settings = action.payload;
  //     if (settings) {
  //       if (settings.languageId) {
  //         dispatch(changeLanguage(settings.languageId));
  //       }
  //     }
  //   });
  // }, [dispatch]);
  useEffect(() => {
    const languageId = i18n.language;
    const fonts = defaultThemeOptions.typography.fontFamily.split(",");
    if (languageId === "ar") {
      fonts[0] = "Almarai";
    } else {
      fonts[0] = "Inter var";
    }

    defaultThemeOptions.typography.fontFamily = fonts.join(",");
    localStorage.setItem("my-language", languageId);
  }, [i18n.language]);
  return (
    <AppConfigContext.Provider value={{ settings }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export default AppConfigProvider;
