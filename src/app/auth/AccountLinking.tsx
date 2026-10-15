import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import LinkEmailDialog from "../main/auth-app/link-email-dialog/LinkEmailDialog";
import LinkPhoneNumberDialog from "../main/auth-app/link-phone-number-dialog/LinkPhoneNumberDialog";
import useJwtAuth from "./services/jwt/useJwtAuth";
export default function AccountLinking({ children }: { children: ReactNode }) {
  const { user } = useJwtAuth();
  const { pathname } = useLocation();
  const needed =
    user?.role === "user" &&
    user.isRegistered &&
    !user.isBlocked &&
    !["/sign-out", "/blocked", "/maintenance"].includes(pathname);
  return (
    <>
      {children}
      {needed && !user.phoneVerified && user.emailVerified && (
        <LinkPhoneNumberDialog required />
      )}
      {needed && !user.emailVerified && user.phoneVerified && (
        <LinkEmailDialog required />
      )}
    </>
  );
}
