import { ReactNode } from "react";
import { matchRoutes, Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import AppContext from "app/AppContext";
import FuseUtils, { FuseRouteItemType } from "@fuse/utils/FuseUtils";
import { User } from "src/app/auth/user";
import {
  accountDestination,
  hasPagePermission,
} from "src/app/auth/permissions";
import {
  getSessionRedirectUrl,
  resetSessionRedirectUrl,
  setSessionRedirectUrl,
} from "./sessionRedirectUrl";

function FuseAuthorization({
  user,
  children,
}: {
  user: User | null;
  children: ReactNode;
  loginRedirectUrl?: string;
}) {
  const { pathname, search, hash } = useLocation();
  const { routes } = useContext(AppContext);
  const matched = matchRoutes(routes, pathname);
  const routeAuth = matched
    ?.map((match) => (match.route as FuseRouteItemType).auth)
    .filter((value) => value !== undefined)
    .slice(-1)[0];
  const publicAuth =
    routeAuth === null || (Array.isArray(routeAuth) && routeAuth.length === 0);
  let redirect: string;
  const maintenance =
    import.meta.env.VITE_MAINTENANCE_MODE === "true" && user?.role !== "admin";
  if (
    maintenance &&
    !["/maintenance", "/sign-in", "/sign-out"].includes(pathname)
  )
    redirect = "/maintenance";
  else if (pathname === "/maintenance") return children;
  else if (user && !["/sign-out", "/logout"].includes(pathname)) {
    const destination = accountDestination(user);
    if (destination !== "/home" && pathname !== destination && !publicAuth)
      redirect = destination;
    else if (
      destination === "/home" &&
      (["/register", "/register-profile", "/blocked"].includes(pathname) ||
        (pathname === "/verify-account" &&
          (user.role !== "user" || user.verificationStatus === "approved")))
    )
      redirect = destination;
    else if (!FuseUtils.hasPermission(routeAuth, user.role)) {
      const saved = getSessionRedirectUrl();
      redirect =
        saved?.startsWith("/") &&
        !saved.startsWith("//") &&
        !/^\/(sign-in|sign-up|sign-out|otp-code-sent|forgot-password|reset-password)/.test(
          saved,
        )
          ? saved
          : destination;
      resetSessionRedirectUrl();
    } else if (!hasPagePermission(pathname, user)) redirect = "/error/401";
  } else if (!FuseUtils.hasPermission(routeAuth, user?.role)) {
    setSessionRedirectUrl(`${pathname}${search}${hash}`);
    redirect = "/sign-in";
  }
  if (redirect && redirect !== pathname)
    return <Navigate to={redirect} replace />;
  return children;
}
export default FuseAuthorization;
