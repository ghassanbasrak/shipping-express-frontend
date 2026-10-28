import { createContext, useEffect } from "react";
// import { selectFuseCurrentSettings } from "./store/fuse/settingsSlice";
import { useSelector } from "react-redux";
import { selectFuseCurrentSettings } from "@fuse/core/FuseSettings/fuseSettingsSlice";
import { selectCurrentLanguageId } from "app/store/i18nSlice";

export const AppConfigContext = createContext({});

function AppConfigProvider({ children }) {
  const settings = useSelector(selectFuseCurrentSettings);
  const languageId = useSelector(selectCurrentLanguageId);
  useEffect(() => {
    localStorage.setItem("my-language", languageId);
  }, [languageId]);
  return (
    <AppConfigContext.Provider value={{ settings }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export default AppConfigProvider;
