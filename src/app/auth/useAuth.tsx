import { useContext } from "react";
import { AuthContext } from "./AuthenticationProvider";
import useJwtAuth from "./services/jwt/useJwtAuth";
function useAuth() {
  const context = useContext(AuthContext);
  const jwt = useJwtAuth();
  return {
    ...context,
    isAuthenticated: jwt.isAuthenticated,
    signOut: jwt.signOut,
    updateUser: jwt.updateMe,
  };
}
export default useAuth;
