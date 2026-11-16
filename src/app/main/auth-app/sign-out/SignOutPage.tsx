import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import { isDemoMode } from "src/app/demo/demoMode";
export default function SignOutPage() {
  const { signOut, authStatus } = useJwtAuth();
  useEffect(() => {
    if (!isDemoMode) signOut();
  }, [signOut]);
  if (isDemoMode) return <Navigate to="/home" replace />;
  return authStatus === "unauthenticated" ? <Navigate to="/sign-in" replace /> : null;
}
