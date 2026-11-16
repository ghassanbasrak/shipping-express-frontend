import type { User } from "../../user";

export type ContactKind = "phone" | "email";
export const normalizeContact = (kind: ContactKind, value: string) =>
  kind === "email" ? value.trim().toLowerCase() : value.replace(/[^\d+]/g, "");

export function otpChallengeId(value: unknown): string {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    String(value).trim() === "" ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < 0
  )
    throw new Error("Missing OTP challenge");
  return String(value);
}

export function assertVerifiedContact(
  user: User,
  ownerId: string,
  kind: ContactKind,
  contact: string,
) {
  const verified = kind === "phone" ? user?.phoneVerified : user?.emailVerified;
  if (
    user?.id !== ownerId ||
    verified !== true ||
    normalizeContact(kind, user[kind] || "") !== normalizeContact(kind, contact)
  )
    throw new Error("Contact verification was not confirmed");
  return user;
}

/** Preserve the profile while updating email through the existing PATCH contract. */
export const emailVerificationProfile = (user: User, email: string) => ({
  email: normalizeContact("email", email),
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  companyName: user.companyName,
  taxNumber: user.taxNumber,
  address: {
    countryId: user.address?.countryId,
    stateId: user.address?.stateId,
    cityId: user.address?.cityId,
    street: user.address?.street,
    zipCode: user.address?.zipCode,
  },
});
