import type { User } from "src/app/auth/user";

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
export const demoStorageKey = "ashamco-demo-data-v1";

export function resetDemoData() {
  if (!isDemoMode) return;
  localStorage.removeItem(demoStorageKey);
  window.location.assign("/home");
}

export const demoUser: User = {
  id: "demo-admin",
  role: "admin",
  firstName: "Demo",
  lastName: "Admin",
  email: "demo@ashamco.local",
  isRegistered: true,
  isBlocked: false,
  verificationStatus: "approved",
  emailVerified: true,
  phoneVerified: true,
};
