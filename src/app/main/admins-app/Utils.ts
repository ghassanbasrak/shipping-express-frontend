import type { IAdminFeature } from "./models/IAdmin";
export const adminRoles = {
  admin: "admin",
  // ALL APPS - PERMISSIONS
  employee: "employee", // Operational access
};
export const toAdminRoleFeatures = (type: string): IAdminFeature[] => {
  switch (type) {
    case adminRoles.admin:
      return Object.values(featureTypes).map((feature) => ({
        feature,
        accessCreate: true,
        accessUpdate: true,
        accessDelete: true,
        accessView: true,
      }));
    case adminRoles.employee:
      return Object.values(featureTypes)
        .filter(
          (feature) =>
            feature !== featureTypes.verificationRequests &&
            feature !== featureTypes.shippingCompanies &&
            feature !== featureTypes.coupons &&
            feature !== featureTypes.plans &&
            feature !== featureTypes.admins &&
            feature !== featureTypes.applications,
        )
        .map((feature) => ({
          feature,
          accessCreate: true,
          accessUpdate: feature !== featureTypes.merchants,
          accessDelete:
            feature === featureTypes.shipments ||
            feature === featureTypes.merchantDues,
          accessView: true,
        }));
  }
  return [];
};
export const featureTypes = {
  merchants: "merchants",
  shipments: "shipments",
  merchantDues: "merchant-dues",
  shipmentUsers: "shipment-users",
  transactions: "transactions",
  codTransactions: "cod-transactions",
  payments: "payments",
  withdrawRequests: "withdraw-requests",
  bankTransfers: "bank-transfers",
  packageRequests: "package-requests",
  verificationRequests: "verification-requests",
  cancelShipmentRequests: "cancel-shipment-requests",
  merchantStatistics: "merchant-statistics",
  admins: "admins",
  coupons: "coupons",
  shippingCompanies: "shipping-companies",
  plans: "plans",
  alerts: "alerts",
  applications: "applications",
};
export const toFeaturesTypeTitle = (feature: string) => {
  switch (feature) {
    case featureTypes.shipments:
      return "SHIPMENTS";
    case featureTypes.shipmentUsers:
      return "SHIPMENT_USERS";
    case featureTypes.transactions:
      return "TRANSACTIONS";
    case featureTypes.codTransactions:
      return "COD_TRANSACTIONS";
    case featureTypes.payments:
      return "PAYMENTS";
    case featureTypes.withdrawRequests:
      return "WITHDRAW_REQUESTS";
    case featureTypes.bankTransfers:
      return "BANK_TRANSFERS";
    case featureTypes.packageRequests:
      return "PACKAGE_REQUESTS";
    case featureTypes.verificationRequests:
      return "VERIFICATION_REQUESTS";
    case featureTypes.cancelShipmentRequests:
      return "CANCEL_SHIPMENT_REQUESTS";
    case featureTypes.admins:
      return "MANAGERS";
    case featureTypes.merchants:
      return "MERCHANTS";
    case featureTypes.merchantStatistics:
      return "MERCHANT_STATISTICS";
    case featureTypes.merchantDues:
      return "MERCHANT_DUES";
    case featureTypes.coupons:
      return "COUPONS";
    case featureTypes.shippingCompanies:
      return "SHIPPING_COMPANIES";
    case featureTypes.plans:
      return "PLANS";
    case featureTypes.alerts:
      return "ALERTS";
    case featureTypes.applications:
      return "APPLICATIONS";
  }
  return feature;
};
export const toFeaturesTypeComparedPath = (feature: string) => {
  switch (feature) {
    case featureTypes.shipments:
      return "shipments";
    case featureTypes.shipmentUsers:
      return "shipment-users";
    case featureTypes.transactions:
      return "wallet";
    case featureTypes.codTransactions:
      return "cod";
    case featureTypes.payments:
      return "topup-requests";
    case featureTypes.withdrawRequests:
      return "withdraw-requests";
    case featureTypes.bankTransfers:
      return "bank-transfers";
    case featureTypes.packageRequests:
      return "package-requests";
    case featureTypes.verificationRequests:
      return "verification-requests";
    case featureTypes.cancelShipmentRequests:
      return "cancel-shipment-requests";
    case featureTypes.admins:
      return "admins";
    case featureTypes.merchants:
      return "merchants";
    case featureTypes.merchantStatistics:
      return "merchant-statistics";
    case featureTypes.merchantDues:
      return "merchant-dues";
    case featureTypes.coupons:
      return "coupons";
    case featureTypes.shippingCompanies:
      return "shipping-companies";
    case featureTypes.plans:
      return "plans";
    case featureTypes.alerts:
      return "alerts";
    case featureTypes.applications:
      return "applications";
  }
  return feature;
};
export const toAdminRoleTitle = (role: string) => {
  switch (role) {
    case adminRoles.admin:
      return "ADMIN";
    case adminRoles.employee:
      return "EMPLOYEE";
  }
  return "EMPLOYEE";
};
export const toAdminRoleColor = (role: string) => {
  switch (role) {
    case adminRoles.employee:
      return "bg-blue-500";
    case adminRoles.admin:
      return "bg-green-500";
  }
  return "bg-blue-500";
};

export const adminRelatedLinks = [
  {
    feature: featureTypes.shipments,
    title: "VIEW_RELATED_SHIPMENTS",
    path: (id: string) => `/shipments/all/all?updatedById=${id}`,
    available: true,
  },
  {
    feature: featureTypes.transactions,
    title: "VIEW_RELATED_TRANSACTIONS",
    path: (id: string) => `/transactions/all/wallet?createdById=${id}`,
    available: true,
  },
  {
    feature: featureTypes.codTransactions,
    title: "VIEW_RELATED_COD_TRANSACTIONS",
    path: (id: string) => `/transactions/all/cod?createdById=${id}`,
    available: true,
  },
  {
    feature: featureTypes.withdrawRequests,
    title: "VIEW_RELATED_WITHDRAW_REQUESTS",
    path: (id: string) => `/withdraw-requests/all?updatedById=${id}`,
    available: true,
  },
  {
    feature: featureTypes.bankTransfers,
    title: "VIEW_RELATED_BANK_TRANSFERS",
    path: (id: string) => `/bank-transfers/all?updatedById=${id}`,
    available: true,
  },
  {
    feature: featureTypes.cancelShipmentRequests,
    title: "VIEW_RELATED_CANCEL_SHIPMENT_REQUESTS",
    path: (id: string) => `/cancel-shipment-requests/all?updatedById=${id}`,
    available: true,
  },
  {
    feature: featureTypes.verificationRequests,
    title: "VIEW_RELATED_VERIFICATION_REQUESTS",
    path: (id: string) => `/verification-requests/all?updatedById=${id}`,
    available: true,
  },
];
