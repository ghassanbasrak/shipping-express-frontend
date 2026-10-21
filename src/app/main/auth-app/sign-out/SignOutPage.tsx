import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import { isDemoMode } from "src/app/demo/demoMode";
export default function SignOutPage() {
  const { signOut, isAuthenticated } = useJwtAuth();
  useEffect(() => {
    if (isAuthenticated && !isDemoMode) signOut();
  }, [signOut, isAuthenticated]);
  if (isDemoMode) return <Navigate to="/home" replace />;
  return isAuthenticated ? null : <Navigate to="/sign-in" replace />;
}
