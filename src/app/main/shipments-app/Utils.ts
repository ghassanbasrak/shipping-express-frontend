import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
import IShipment from "./models/IShipment";
import type { ShipmentFormValues } from "./models/ShipmentSchema";
import type { CreateShipmentApiArg } from "./ShipmentsApi";
import {
  nationalAddressSeparator,
  splitShipmentUserPhone,
} from "../shipment-users-app/Utils";
import type IShipmentUser from "../shipment-users-app/models/IShipmentUser";
import { displayName } from "../countries-app/Utils";
export const shippingTypes = {
  local: "local",
  international: "international",
};
export const shippingFilterTypes = {
  local: "local",
  international: "international",
  cashOnDelivery: "cashOnDelivery",
};

export const shipmentTypes = {
  document: "document",
  boxes: "box",
};
export const shipmentStatus = {
  pending: "pending",
  processing: "processing",
  delivered: "delivered",
  canceled: "canceled",
  failed: "failed",
  returned: "returned",
  requestCancel: "cancelRequest",
};
export const shipmentPaymentStatus = {
  paid: "paid",
  pending: "pending",
  notPaid: "canceled",
  settled: "settled",
  block: "block",
};

export const toShippingTypeTitle = (type: string) => {
  switch (type) {
    case shippingTypes.local:
      return "LOCAL";
    case shippingTypes.international:
      return "INTERNATIONAL";
  }
  return "LOCAL";
};
export const toShippingFilterTypeTitle = (type: string) => {
  switch (type) {
    case shippingFilterTypes.local:
      return "LOCAL";
    case shippingFilterTypes.international:
      return "INTERNATIONAL";
    case shippingFilterTypes.cashOnDelivery:
      return "CASH_ON_DELIVERY";
  }
  return "LOCAL";
};
export const toShippingTypeColor = (type: string) => {
  switch (type) {
    case shippingTypes.local:
      return "primary";
    case shippingTypes.international:
      return "success";
  }
  return "primary";
};

export const toShipmentTypeTitle = (type: string) => {
  switch (type) {
    case shipmentTypes.boxes:
      return "BOXES";
    case shipmentTypes.document:
      return "DOCUMENT";
  }
  return "BOXES";
};

export const toShipmentStatusTitle = (status: string) => {
  switch (status) {
    case shipmentStatus.pending:
      return "PENDING";
    case shipmentStatus.processing:
      return "ACTIVE_SHIPMENT";
    case shipmentStatus.delivered:
      return "DELIVERED";
    case shipmentStatus.canceled:
      return "CANCELED";
    case shipmentStatus.failed:
      return "FAILED";
    case shipmentStatus.returned:
      return "RETURNED";
    case shipmentStatus.requestCancel:
      return "REQUEST_CANCEL";
  }
  return "ACTIVE_SHIPMENT";
};

export const toShipmentStatusColor = (
  status: string,
  classNameColor = true,
) => {
  switch (status) {
    case shipmentStatus.pending:
      return classNameColor ? "bg-blue-400" : "#5DADE2";
    case shipmentStatus.processing:
      return classNameColor ? "bg-green-400" : "#99CC00";
    case shipmentStatus.delivered:
      return classNameColor ? "bg-blue-700" : "#5DADE2";
    case shipmentStatus.failed:
      return classNameColor ? "bg-red-600" : "#FF0000";
    case shipmentStatus.canceled:
      return classNameColor ? "bg-red-400" : "#FF0044";
    case shipmentStatus.returned:
      return classNameColor ? "bg-red-500" : "#FF000F";
    case shipmentStatus.requestCancel:
      return classNameColor ? "bg-red-300" : "#FF0030";
  }
  return classNameColor ? "bg-green-400" : "#99CC00";
};

export const toShipmentPaymentStatusTitle = (type: string) => {
  switch (type) {
    case shipmentPaymentStatus.paid:
      return "PAID";
    case shipmentPaymentStatus.notPaid:
      return "NOT_PAID";
    case shipmentPaymentStatus.pending:
      return "PENDING";
    case shipmentPaymentStatus.settled:
      return "SETTLED";
    case shipmentPaymentStatus.block:
      return "PAYMENT_BLOCK";
  }
  return "PENDING";
};
export const toShipmentPaymentStatusColor = (type: string) => {
  switch (type) {
    case shipmentPaymentStatus.paid:
      return "bg-green-500";
    case shipmentPaymentStatus.notPaid:
      return "bg-red-400";
    case shipmentPaymentStatus.pending:
      return "bg-blue-400";
    case shipmentPaymentStatus.settled:
      return "bg-green-800";
    case shipmentPaymentStatus.block:
      return "bg-red-800";
  }
  return "bg-blue-400";
};

export const defaultCountryId =
  import.meta.env.VITE_DEMO_MODE === "true"
    ? "demo-country-sa"
    : import.meta.env.VITE_DEFAULT_COUNTRY_ID || "65fd1a1c1fdbc094e3369b29";
export const defaultCountryCode =
  import.meta.env.VITE_DEFAULT_COUNTRY_CODE || "SA";
export const defaultCountry = {
  id: defaultCountryId,
  name: {
    en: import.meta.env.VITE_DEFAULT_COUNTRY_NAME_EN || "Saudi Arabia",
    ar:
      import.meta.env.VITE_DEFAULT_COUNTRY_NAME_AR ||
      "المملكة العربية السعودية",
  },
  code: defaultCountryCode,
};
export const toShipmentTypeColor = () => "bg-blue-500";
export const toShippingFilterTypeColor = (value: string) =>
  value === "cashOnDelivery"
    ? "bg-amber-500"
    : value === "international"
      ? "bg-green-500"
      : "bg-blue-500";
export const checkIfShipmentReturned = (value: Partial<IShipment>) =>
  Boolean(
    value.orderReturned ||
      value.returnedFromShipmentId ||
      value.shipmentDetails?.description?.startsWith("مرتجعة:"),
  );
export function decompressShipment(
  value: Partial<IShipment> & { _doc?: Partial<IShipment> },
): IShipment {
  if (!value) return null;
  const document = { ...value, ...(value._doc || {}) };
  const details = document.shipmentDetails || {},
    cod = document.shipmentCod || {};
  const result = {
    ...document,
    ...details,
    ...cod,
    id: document.id || document._id || details.shipmentId,
    products: (document.shipmentProducts || document.products || []).map(
      (item) => ({ ...item }),
    ),
  };
  // Nested document IDs must never overwrite the owning shipment ID.
  for (const key of ["_doc", "$$populatedVirtuals", "$__", "$isNew"])
    delete result[key];
  return result;
}
export const canViewShipments = (user: User) =>
  hasOperationPermission("shipments", "view", user);
export const canCreateShipment = (user: User) =>
  canViewShipments(user) && hasOperationPermission("shipments", "create", user);
export const canUpdateShipment = (
  user: User,
  feature: "shipments" | "merchant-dues" = "shipments",
) =>
  user?.role !== "user" &&
  hasOperationPermission(feature, "view", user) &&
  hasOperationPermission(feature, "update", user);
export const canReturnShipmentStatus = (
  user: User,
  row: IShipment,
  feature: "shipments" | "merchant-dues" = "shipments",
) =>
  canUpdateShipment(user, feature) &&
  hasOperationPermission(feature, "delete", user) &&
  row.status !== shipmentStatus.returned;
export const canSettleShipment = (
  user: User,
  row: IShipment,
  feature: "shipments" | "merchant-dues" = "shipments",
) =>
  canUpdateShipment(user, feature) &&
  row.isCod &&
  row.status !== shipmentStatus.returned &&
  row.shipmentCod?.codStatus === shipmentPaymentStatus.pending &&
  Boolean(row.shipmentCod.id);
export const canRequestShipmentCancel = (user: User, row: IShipment) =>
  user?.role === "user" &&
  canViewShipments(user) &&
  row.userId === user.id &&
  row.status === shipmentStatus.processing &&
  Boolean(row.trackingNumber);
export const canGenerateReturnedShipment = (user: User, row: IShipment) =>
  canRequestShipmentCancel(user, row) &&
  !row.returnedFromShipmentId &&
  !row.returnedShipmentId &&
  !row.returnedFromShipment &&
  !row.returnedShipment;
export const canSyncShipmentTracking = (row: IShipment) =>
  ["aramex", "smsa", "smsacold"].includes(row.shippingCompany?.serviceName);
export const shipmentPath = (carrier = "all", type = "all", id?: string) =>
  `/shipments/${carrier || "all"}/${type || "all"}${id ? `/${id}` : ""}`;
export const numericShipmentText = (value: string = "") =>
  value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
export const shipmentVolumetricWeight = (value: Partial<ShipmentFormValues>) =>
  Math.ceil(
    ((Number(value.length || 0) *
      Number(value.width || 0) *
      Number(value.height || 0)) /
      (value.shippingCompany?.serviceName === "aramex" ? 4000 : 5000)) *
      Number(value.packagesCount || 0),
  );
export function splitShipmentStreet(street = "") {
  const index = street.indexOf(nationalAddressSeparator);
  return index < 0
    ? { street, nationalAddress: "" }
    : {
        street: street.slice(0, index),
        nationalAddress: street.slice(index + nationalAddressSeparator.length),
      };
}
export function savedShipmentContact(
  value: IShipmentUser,
  prefix: "sender" | "receiver",
) {
  const phone = splitShipmentUserPhone(numericShipmentText(value.phone || "")),
    phone1 = splitShipmentUserPhone(numericShipmentText(value.phone1 || "")),
    address = value.address || {},
    street = splitShipmentStreet(address.street);
  return {
    [`${prefix}Id`]: value.id,
    [`${prefix}Name`]: value.fullName || "",
    [`${prefix}Email`]: value.email || "",
    [`${prefix}Phone`]: phone.number,
    [`${prefix}PhoneCountry`]: phone.code,
    [`${prefix}Phone1`]: phone1.number,
    [`${prefix}PhoneCountry1`]: phone1.code,
    [`${prefix}CountryId`]: address.countryId || "",
    [`${prefix}StateId`]: address.stateId || "",
    [`${prefix}CityId`]: address.cityId || "",
    [`${prefix}Street`]: street.street,
    [`${prefix}NationalAddress`]: street.nationalAddress,
    [`${prefix}ZipCode`]: address.zipCode || "",
  };
}
export function shipmentContactValues(
  value: ShipmentFormValues,
  prefix: "sender" | "receiver",
) {
  const street = value[`${prefix}Street`] || "",
    national = value[`${prefix}NationalAddress`];
  const address = {
    countryId: value[`${prefix}CountryId`],
    stateId: value[`${prefix}StateId`] || undefined,
    cityId: value[`${prefix}CityId`],
    street: national
      ? `${street}${nationalAddressSeparator}${national}`
      : street,
    zipCode: value[`${prefix}ZipCode`] || undefined,
  };
  return {
    type: prefix,
    fullName: value[`${prefix}Name`],
    phone: numericShipmentText(
      `${value[`${prefix}PhoneCountry`] || "+966"}-${value[`${prefix}Phone`] || ""}`,
    ),
    ...(value[`${prefix}Phone1`]
      ? {
          phone1: numericShipmentText(
            `${value[`${prefix}PhoneCountry1`] || "+966"}-${value[`${prefix}Phone1`]}`,
          ),
        }
      : {}),
    ...(value[`${prefix}Email`] ? { email: value[`${prefix}Email`] } : {}),
    address,
  };
}
export function compressShipment(
  value: ShipmentFormValues,
): CreateShipmentApiArg {
  const payload = {
    shippingCompanyId: value.shippingCompanyId,
    method: value.method,
    type: value.type,
    length: Number(value.length),
    width: Number(value.width),
    height: Number(value.height),
    weight: Number(value.weight),
    packagesCount: Number(value.packagesCount),
    description: value.description,
    isCommercial: Boolean(value.isCommercial),
    isCod: Boolean(value.isCod && !value.returnedFromShipmentId),
  } as CreateShipmentApiArg;
  for (const prefix of ["sender", "receiver"] as const) {
    for (const suffix of [
      "Name",
      "CountryId",
      "CountryName",
      "CountryCode",
      "CityId",
      "CityName",
      "Street",
    ])
      payload[`${prefix}${suffix}`] = value[`${prefix}${suffix}`];
    if (value.shippingCompany?.hasState)
      for (const suffix of ["StateId", "StateName"])
        payload[`${prefix}${suffix}`] = value[`${prefix}${suffix}`];
    const id = value[`${prefix}Id`];
    if (id && id !== "new") payload[`${prefix}Id`] = id;
    for (const suffix of ["Email", "ZipCode"])
      if (value[`${prefix}${suffix}`])
        payload[`${prefix}${suffix}`] = value[`${prefix}${suffix}`];
    payload[`${prefix}Phone`] = numericShipmentText(
      `${value[`${prefix}PhoneCountry`] || "+966"}-${value[`${prefix}Phone`] || ""}`,
    );
    if (value[`${prefix}Phone1`])
      payload[`${prefix}Phone1`] = numericShipmentText(
        `${value[`${prefix}PhoneCountry1`] || "+966"}-${value[`${prefix}Phone1`]}`,
      );
    if (value[`${prefix}NationalAddress`])
      payload[`${prefix}Street`] =
        `${payload[`${prefix}Street`] || ""}${value.shippingCompanyId === "66002f5c07d4cc8bca3eb0e0" ? "-" : nationalAddressSeparator}${value[`${prefix}NationalAddress`]}`;
  }
  if (
    value.senderNamePrefix &&
    !payload.senderName?.startsWith(`${value.senderNamePrefix} `)
  )
    payload.senderName =
      `${value.senderNamePrefix} ${payload.senderName || ""}`.trim();
  if (payload.isCod) payload.codPrice = Number(value.codPrice);
  if (value.couponCodeId) {
    payload.couponCodeId = value.couponCodeId;
    payload.couponCode = value.couponCode;
  }
  if (value.method !== shippingTypes.local && value.imageUrl)
    payload.imageUrl = value.imageUrl;
  if (value.isCommercial && value.type !== shipmentTypes.document)
    payload.products = (value.products || []).map((item) => ({
      title: item.title,
      price: Number(item.price),
    }));
  if (value.returnedFromShipmentId) {
    payload.returnedFromShipmentId = value.returnedFromShipmentId;
    payload.orderReturned = true;
    if (value.userId) payload.userId = value.userId;
  }
  return payload;
}
export function generateReturnedShipment(
  shipment: IShipment,
): Partial<ShipmentFormValues> {
  const flat = decompressShipment(shipment),
    value = { ...flat } as Partial<ShipmentFormValues>;
  for (const [to, from] of [
    ["sender", "receiver"],
    ["receiver", "sender"],
  ]) {
    for (const suffix of [
      "Name",
      "Email",
      "CountryId",
      "CountryName",
      "CountryCode",
      "Country",
      "StateId",
      "StateName",
      "State",
      "CityId",
      "CityName",
      "City",
      "ZipCode",
    ])
      value[`${to}${suffix}`] = flat[`${from}${suffix}`];
    const phone = splitShipmentUserPhone(flat[`${from}Phone`] || ""),
      phone1 = splitShipmentUserPhone(flat[`${from}Phone1`] || "");
    value[`${to}Phone`] = phone.number;
    value[`${to}PhoneCountry`] = phone.code;
    value[`${to}Phone1`] = phone1.number;
    value[`${to}PhoneCountry1`] = phone1.code;
    const address = splitShipmentStreet(flat[`${from}Street`]);
    value[`${to}Street`] = address.street;
    value[`${to}NationalAddress`] = address.nationalAddress;
    value[`${to}Id`] = "new";
  }
  delete value.id;
  value.shippingCompanyId = "";
  value.shippingCompany = null;
  value.senderNamePrefix = "";
  value.orderReturned = true;
  value.returnedFromShipmentId = shipment.id;
  value.isCod = false;
  value.codPrice = 0;
  value.description = `مرتجعة: ${flat.description || ""}`;
  value.acceptExtraWeightTerms = true;
  return value;
}
export const shipmentErrorMessage = (error: unknown, fallback: string) => {
  const value = error as { data?: { message?: string }; message?: string };
  return typeof value?.data?.message === "string"
    ? value.data.message
    : typeof value?.message === "string"
      ? value.message
      : fallback;
};
export const shippingGeoName = (
  value: {
    name?: unknown;
    shipmentStates?: { shippingCompanyId?: string; name?: string }[];
    shipmentCities?: { shippingCompanyId?: string; name?: string }[];
  },
  carrier: string,
  kind: "country" | "state" | "city",
) => {
  if (!value) return "";
  if (kind === "country")
    return typeof value.name === "string"
      ? value.name
      : (value.name as { en?: string })?.en || displayName(value.name as never);
  return (
    (kind === "state" ? value.shipmentStates : value.shipmentCities)?.find(
      (item) => item.shippingCompanyId === carrier,
    )?.name || ""
  );
};
