import { User } from "./user";
export type Operation = "exist" | "view" | "create" | "update" | "delete";
const featurePaths: Record<string, string> = {
  transactions: "wallet",
  "cod-transactions": "cod",
  payments: "topup-requests",
};
export function hasOperationPermission(
  feature: string,
  operation: Operation,
  user: User | null,
) {
  if (!user || !["admin", "employee", "user"].includes(user.role)) return false;
  if (user.role === "user" || !user.features?.length) return true;
  const permission = user.features.find((item) => item.feature === feature);
  if (!permission) return false;
  return (
    operation === "exist" ||
    Boolean(
      permission[
        {
          view: "accessView",
          create: "accessCreate",
          update: "accessUpdate",
          delete: "accessDelete",
        }[operation]
      ],
    )
  );
}
export function hasPagePermission(pathname: string, user: User | null) {
  if (!user) return true; // Route auth determines guest access.
  if (!["admin", "employee", "user"].includes(user.role)) return false;
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];
  if (user.role === "user")
    return !pathname.includes("affiliate") || Boolean(user.isAffiliate);
  const publicPaths = [
    "home",
    "profile",
    "edit-profile",
    "sign-in",
    "sign-in-phone",
    "otp-code-sent",
    "sign-up",
    "register",
    "register-profile",
    "verify-account",
    "blocked",
    "sign-out",
    "logout",
    "forgot-password",
    "reset-password",
    "reset-code-sent",
    "maintenance",
    "error",
    "pages",
    "privacy-policy",
    "delete-account",
    "delete-my-account",
    "shipping-price-calculator",
    "link-email",
    "link-phone",
  ];
  if (!first || publicPaths.includes(first) || !user.features?.length)
    return true;
  if (
    ["countries", "states", "cities", "logs"].includes(first) &&
    user.role === "admin"
  )
    return true;
  if (first === "transaction-reports")
    return user.features.some((p) =>
      ["transactions", "cod-transactions"].includes(p.feature),
    );
  if (first === "transactions" && parts[2] === "all" && parts[3] === "new") {
    return (
      hasOperationPermission("merchants", "update", user) &&
      ["transactions", "cod-transactions"].some((f) =>
        hasOperationPermission(f, "create", user),
      )
    );
  }
  const path = first === "transactions" ? parts[2] : first;
  return user.features.some(
    (p) =>
      (featurePaths[p.feature] || p.feature) === path &&
      (!["new", "invite"].includes(parts.slice(-1)[0]) || p.accessCreate),
  );
}
export function requiresVerification(user: User | null, now = Date.now()) {
  if (!user || user.role !== "user" || user.verificationStatus === "approved")
    return false;
  const expires = user.verificationExpiresAt
    ? new Date(user.verificationExpiresAt).getTime()
    : 0;
  return (
    !Number.isFinite(expires) || Math.floor((expires - now) / 86400000) <= 0
  );
}
export function accountDestination(user: User | null) {
  if (!user) return "/sign-in";
  if (user.isBlocked) return "/blocked";
  if (!user.isRegistered) return "/register";
  if (requiresVerification(user)) return "/verify-account";
  return "/home";
}
