import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
import { displayName } from "../countries-app/Utils";
import { splitShipmentUserPhone } from "../shipment-users-app/Utils";
import IPackageRequest from "./models/IPackageRequest";
import IPackagingSupply from "./models/IPackagingSupply";
import type { PackageRequestFormValues } from "./models/PackageRequestSchema";
export const packageRequestStatus = {
  pending: "pending",
  accepted: "approved",
  rejected: "rejected",
} as const;
export const packageRequestTypes = { bags: "bags" } as const;
export const toPackageRequestStatusTitle = (status: string) =>
  ({ pending: "PENDING", approved: "ACCEPTED", rejected: "REJECTED" })[
    status
  ] || status;
export const toPackageRequestStatusColor = (status: string) =>
  ({
    pending: "bg-blue-600",
    approved: "bg-green-600",
    rejected: "bg-red-600",
  })[status] || "bg-gray-600";
export const toPackageRequestTypeTitle = (type: string) =>
  type === packageRequestTypes.bags ? "PACKAGE_REQUESTS" : type;
export const toPackageRequestTypeColor = () => "bg-blue-600";
export const canReviewPackageRequest = (user: User, status: string) =>
  user.role !== "user" &&
  hasOperationPermission("package-requests", "view", user) &&
  hasOperationPermission("package-requests", "update", user) &&
  status === packageRequestStatus.pending;
export const packagingSuppliesLabel = (products: IPackagingSupply[] = []) =>
  products
    .map((product) => `${displayName(product.name)} (${product.count ?? 0})`)
    .join(", ");
export function packagingTotal(ids: string[], products: IPackagingSupply[]) {
  const selected = ids.map((id) =>
    products.find((product) => product.id === id),
  );
  return selected.some((product) => !product || !Number.isFinite(product.price))
    ? undefined
    : selected.reduce((sum, product) => sum + product.price, 0);
}
export function toPackageRequestFormValues(
  value: IPackageRequest,
): PackageRequestFormValues {
  const phone = splitShipmentUserPhone(value.phone);
  return {
    ...value,
    productIds: [...(value.productIds || [])],
    shippingAddress: { ...value.shippingAddress },
    phone: phone.number,
    phoneCountry: phone.code,
  };
}
export function packageRequestSaveValues(
  values: PackageRequestFormValues,
  amount: number,
) {
  const address = values.shippingAddress;
  return {
    amount,
    productIds: [...values.productIds],
    fullName: values.fullName,
    phone: `${values.phoneCountry}-${values.phone}`,
    ...(values.description ? { description: values.description } : {}),
    shippingAddress: {
      countryId: address.countryId,
      stateId: address.stateId,
      ...(address.cityId ? { cityId: address.cityId } : {}),
      ...(address.street ? { street: address.street } : {}),
      ...(address.zipCode ? { zipCode: address.zipCode } : {}),
    },
  };
}
