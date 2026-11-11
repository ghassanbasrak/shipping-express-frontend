import type { User } from "src/app/auth/user";

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
export const demoStorageKey = "ashamco-demo-data-v1";
export const demoIdentityKey = "ashamco-demo-identity";

export type DemoIdentity = "admin" | "merchant" | "affiliate";

export function getDemoIdentity(): DemoIdentity {
  const saved = localStorage.getItem(demoIdentityKey);
  return saved === "merchant" || saved === "affiliate" ? saved : "admin";
}

function getDefaultDemoUser(): User {
  if (getDemoIdentity() === "affiliate")
    return {
      ...demoUser,
      id: "demo-affiliate",
      role: "user",
      firstName: "Demo",
      lastName: "Affiliate",
      email: "affiliate@ashamco.local",
      isAffiliate: true,
      balance: 4500,
      codBalance: 1200,
    };
  if (getDemoIdentity() === "merchant")
    return {
      ...demoUser,
      id: "demo-merchant",
      role: "user",
      firstName: "Demo",
      lastName: "Merchant",
      email: "merchant@ashamco.local",
      isAffiliate: false,
      balance: 5000,
      codBalance: 1800,
    };
  return demoUser;
}

let cachedSnapshot: string | null = null;
let cachedUsers: User[] = [];
export function getDemoUser(): User {
  const fallback = getDefaultDemoUser();
  // Read saved profile/balances at startup and after demo writes, without changing live auth.
  try {
    const snapshot = localStorage.getItem(demoStorageKey);
    if (snapshot !== cachedSnapshot) {
      cachedSnapshot = snapshot;
      cachedUsers = snapshot ? JSON.parse(snapshot).users || [] : [];
    }
    const saved = cachedUsers.find((user) => user.id === fallback.id);
    return saved ? { ...fallback, ...saved } : fallback;
  } catch {
    return fallback;
  }
}

export function switchDemoIdentity(identity: DemoIdentity) {
  if (!isDemoMode) return;
  localStorage.setItem(demoIdentityKey, identity);
  window.location.assign("/home");
}

export function resetDemoData() {
  if (!isDemoMode) return;
  localStorage.removeItem(demoStorageKey);
  localStorage.removeItem(demoIdentityKey);
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
