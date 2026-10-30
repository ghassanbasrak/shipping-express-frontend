import type { User } from "src/app/auth/user";
import IShipment from "../shipments-app/models/IShipment";
import IMerchant from "../merchants-app/models/IMerchant";
import IShippingCompany from "../shipping-companies-app/models/IShippingCompany";
import { decompressShipment } from "../shipments-app/Utils";
import { overviewNumber } from "app/shared-components/overview/Utils";
export const homeShipmentRows = (shipments: IShipment[], userId: string) =>
  shipments
    .filter(
      (shipment) =>
        shipment &&
        (!(shipment.userId || shipment.user?.id) ||
          (shipment.userId || shipment.user?.id) === userId),
    )
    .map(decompressShipment);
export const homeCarrierPrice = (
  carrier: IShippingCompany,
  account?: IMerchant,
) => {
  const custom =
    account?.loyaltyType === "custom"
      ? overviewNumber(
          (Array.isArray(account.prices) ? account.prices : []).find(
            (p) => p?.shippingCompanyId === carrier.id,
          )?.localPrice,
        )
      : null;
  return custom !== null && custom >= 0
    ? custom
    : overviewNumber(carrier.localPrice);
};
export const staffWorkspaceLinks = [
  {
    feature: "shipments",
    title: "SHIPMENTS",
    description: "STAFF_SHIPMENTS",
    icon: "local_shipping",
    path: "/shipments/all/all",
  },
  {
    feature: "merchants",
    title: "MERCHANTS",
    description: "STAFF_MERCHANTS",
    icon: "groups",
    path: "/merchants",
  },
  {
    feature: "transactions",
    title: "WALLET_LEDGER",
    description: "STAFF_WALLET",
    icon: "account_balance_wallet",
    path: "/transactions/all/wallet",
  },
  {
    feature: "cod-transactions",
    title: "COD_LEDGER",
    description: "STAFF_COD",
    icon: "payments",
    path: "/transactions/all/cod",
  },
  {
    feature: "withdraw-requests",
    title: "WITHDRAWALS",
    description: "STAFF_REQUESTS",
    icon: "request_quote",
    path: "/withdraw-requests/all",
  },
  {
    feature: "package-requests",
    title: "PACKAGING_REQUESTS",
    description: "STAFF_PACKAGING",
    icon: "inventory_2",
    path: "/package-requests/all",
  },
];
