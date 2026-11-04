import { useEffect } from "react";
import BrowserRouter from "@fuse/core/BrowserRouter";
import FuseAuthorization from "@fuse/core/FuseAuthorization/FuseAuthorization";
import FuseSplashScreen from "@fuse/core/FuseSplashScreen";
import { Alert, Box, Button, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "app/store/hooks";
import { setUser, resetUser } from "./user/store/userSlice";
import useJwtAuth from "./services/jwt/useJwtAuth";
import useAuth from "./useAuth";
import AccountLinking from "./AccountLinking";
import FirebaseMessagingApp from "./services/firebase/FirebaseMessagingApp";

function Authentication({ children }: { children: React.ReactNode }) {
  const { user, authStatus, retrySession } = useJwtAuth();
  const { t } = useTranslation("ashamcoAuth");
  const { setAuthProvider, resetAuthProvider, setIsAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (authStatus === "configuring") return;
    if (user) {
      dispatch(setUser(user));
      setAuthProvider("jwt");
    } else {
      dispatch(resetUser());
      resetAuthProvider();
    }
    setIsAuthenticated(authStatus === "authenticated");
  }, [
    user,
    authStatus,
    dispatch,
    setAuthProvider,
    resetAuthProvider,
    setIsAuthenticated,
  ]);
  if (authStatus === "configuring") return <FuseSplashScreen />;
  if (authStatus === "unavailable")
    return (
      <Box className="min-h-screen flex items-center justify-center p-16">
        <Paper className="w-full max-w-480 p-24 flex flex-col gap-16">
          <Alert severity="warning">{t("SESSION_UNAVAILABLE")}</Alert>
          <Button variant="contained" onClick={() => void retrySession()}>
            {t("RETRY")}
          </Button>
        </Paper>
      </Box>
    );
  return (
    <BrowserRouter>
      <FirebaseMessagingApp />
      <FuseAuthorization user={user}>
        <AccountLinking>{children}</AccountLinking>
      </FuseAuthorization>
    </BrowserRouter>
  );
}
export default Authentication;
