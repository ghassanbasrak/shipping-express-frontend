import { tokens } from "src/brand/tokens";
import IShippingCompany from "./models/IShippingCompany";

export const shippingMethods = {
  local: "local",
  international: "international",
  cashOnDelivery: "cashOnDelivery",
};

export const toShippingMethodTitle = (method: string) => {
  switch (method) {
    case shippingMethods.local:
      return "LOCAL";
    case shippingMethods.international:
      return "INTERNATIONAL";
    case shippingMethods.cashOnDelivery:
      return "CASH_ON_DELIVERY";
    default:
      return "LOCAL";
  }
};

export const toShippingMethodColor = (method: string) => {
  switch (method) {
    case shippingMethods.local:
      return tokens.color.purple["300"];
    case shippingMethods.international:
      return tokens.color.mint["300"];
    case shippingMethods.cashOnDelivery:
      return tokens.color.semantic.dark.warning;
    default:
      return tokens.color.purple["300"];
  }
};

export function changeShippingMethods(
  current: string[],
  method: string,
  checked: boolean,
) {
  const next = checked
    ? [...new Set([...current, method])]
    : current.filter((value) => value !== method);
  return next.includes(shippingMethods.local)
    ? next
    : next.filter((value) => value !== shippingMethods.cashOnDelivery);
}

// Enable each dependent route when its feature is migrated. Keep its original path.
export const shippingCompanySummaryLinks: {
  title: string;
  count: keyof IShippingCompany;
  path: (id: string) => string;
  available: boolean;
  adminOnly?: boolean;
}[] = [
  {
    title: "SHIPMENTS",
    count: "shipmentsCount",
    path: (id) => `/shipments/${id}/all`,
    available: true,
  },
  {
    title: "PACKAGE_REQUESTS",
    count: "packageRequestsCount",
    path: () => "/package-requests/all",
    available: true,
  },
  {
    title: "COUNTRIES",
    count: "shipmentCountriesCount",
    path: (id) => `/countries/${id}`,
    available: true,
    adminOnly: true,
  },
  {
    title: "STATES",
    count: "shipmentStatesCount",
    path: (id) => `/states/${id}/all`,
    available: true,
    adminOnly: true,
  },
  {
    title: "CITIES",
    count: "shipmentCitiesCount",
    path: (id) => `/cities/${id}/all`,
    available: true,
    adminOnly: true,
  },
];
