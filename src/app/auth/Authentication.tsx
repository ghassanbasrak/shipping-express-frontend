import { useEffect } from "react";
import BrowserRouter from "@fuse/core/BrowserRouter";
import FuseAuthorization from "@fuse/core/FuseAuthorization/FuseAuthorization";
import FuseSplashScreen from "@fuse/core/FuseSplashScreen";
import { useAppDispatch } from "app/store/hooks";
import { setUser, resetUser } from "./user/store/userSlice";
import useJwtAuth from "./services/jwt/useJwtAuth";
import useAuth from "./useAuth";
import AccountLinking from "./AccountLinking";
import FirebaseMessagingApp from "./services/firebase/FirebaseMessagingApp";

function Authentication({ children }: { children: React.ReactNode }) {
  const { user, authStatus } = useJwtAuth();
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
