import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import BrowserRouter from "@fuse/core/BrowserRouter";
import FuseAuthorization from "@fuse/core/FuseAuthorization/FuseAuthorization";
import FuseSplashScreen from "@fuse/core/FuseSplashScreen";
import { Alert, Box, Button, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { setUser, resetUser, selectUser } from "./user/store/userSlice";
import useJwtAuth from "./services/jwt/useJwtAuth";
import useAuth from "./useAuth";
import FirebaseMessagingApp from "./services/firebase/FirebaseMessagingApp";
import SignOutPage from "../main/auth-app/sign-out/SignOutPage";

function Authentication({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <AuthenticationContent>{children}</AuthenticationContent>
    </BrowserRouter>
  );
}

function AuthenticationContent({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, authStatus, retrySession } = useJwtAuth();
  const storedUser = useAppSelector(selectUser);
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
  // Logout must remain available before session restoration or layout loading finishes.
  if (["/sign-out", "/logout"].includes(pathname)) return <SignOutPage />;
  // Feature pages read Redux; wait until it contains the authenticated account.
  if (
    authStatus === "configuring" ||
    (authStatus === "authenticated" &&
      (!user ||
        !storedUser ||
        storedUser.id !== user.id ||
        storedUser.role !== user.role))
  )
    return <FuseSplashScreen />;
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
    <>
      <FirebaseMessagingApp />
      <FuseAuthorization user={user}>
        {children}
      </FuseAuthorization>
    </>
  );
}
export default Authentication;
