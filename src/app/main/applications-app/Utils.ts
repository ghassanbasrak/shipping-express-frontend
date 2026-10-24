import type { User } from "src/app/auth/user";
import IApplication, { IApplicationScope } from "./models/IApplication";
export const applicationFeatures = {
  users: "users",
  shipments: "shipments",
  cities: "cities",
  states: "states",
  countries: "countries",
  shippingUsers: "shipping-users",
  shippingCompanies: "shipping-companies",
} as const;
export const toApplicationFeatureTitle = (feature: string) =>
  ({
    users: "USERS",
    shipments: "SHIPMENTS",
    cities: "CITIES",
    states: "STATES",
    countries: "COUNTRIES",
    "shipping-users": "SHIPPING_USERS",
    "shipping-companies": "SHIPPING_COMPANIES",
  })[feature] || feature;
export const applicationFeatureCanWrite = (feature: string) =>
  feature === applicationFeatures.shipments ||
  feature === applicationFeatures.shippingUsers;
export const toApplicationFeatureColor = (feature: string) =>
  applicationFeatureCanWrite(feature) ? "bg-green-600" : "bg-blue-600";
export const newApplicationScope = (feature: string): IApplicationScope => ({
  feature,
  read: true,
  write: applicationFeatureCanWrite(feature),
  maxHourlyUsage: 300,
});
export const applicationUserLabel = (user?: User) =>
  user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email ||
      user.id
    : "";
export function toApplicationSaveValues(values: IApplication): IApplication {
  return {
    id: values.id,
    name: { ...values.name },
    clientName: values.clientName,
    userId: values.userId,
    scopes: (values.scopes || []).map((scope) => ({
      feature: scope.feature,
      read: scope.read,
      write: scope.write,
      ...(scope.maxHourlyUsage !== undefined
        ? { maxHourlyUsage: scope.maxHourlyUsage }
        : {}),
    })),
  };
}
