import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
export default function SignOutPage() {
  const { signOut, isAuthenticated } = useJwtAuth();
  useEffect(() => {
    if (isAuthenticated) signOut();
  }, [signOut, isAuthenticated]);
  return isAuthenticated ? null : <Navigate to="/sign-in" replace />;
}
