import { userRoles, type User } from "src/app/auth/user";
import { tokens } from "src/brand/tokens";
import { hasOperationPermission } from "src/app/auth/permissions";
import IShipment from "./models/IShipment";
import type { ShipmentFormValues } from "./models/ShipmentSchema";
import type { CreateShipmentApiArg } from "./ShipmentsApi";
import type {
  ReviewShipmentCompaniesApiArg,
  ReviewShipmentCompaniesApiResponse,
  ReviewedShipmentCompany,
} from "./ShipmentsApi";
import {
  nationalAddressSeparator,
  splitShipmentUserPhone,
} from "../shipment-users-app/Utils";
import type IShipmentUser from "../shipment-users-app/models/IShipmentUser";
import type IShippingCompany from "../shipping-companies-app/models/IShippingCompany";
import type IWarehouse from "../storage-app/models/IWarehouse";
import type { ShipmentWarehouse } from "./models/ShipmentSchema";
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

// Soft status-tone classes (tokens.color.tone) when classNameColor, otherwise solid brand hexes for charts/solid chips.
// Delivered uses the neutral brand tone so it stays distinguishable from the pending (info) status.
export const toShipmentStatusColor = (
  status: string,
  classNameColor = true,
) => {
  const solid = tokens.color.solid;
  switch (status) {
    case shipmentStatus.pending:
      return classNameColor
        ? "bg-status-info-bg text-status-info-fg"
        : solid.info;
    case shipmentStatus.processing:
      return classNameColor
        ? "bg-status-success-bg text-status-success-fg"
        : solid.success;
    case shipmentStatus.delivered:
      return classNameColor
        ? "bg-status-neutral-bg text-status-neutral-fg"
        : solid.neutral;
    case shipmentStatus.failed:
    case shipmentStatus.canceled:
    case shipmentStatus.returned:
    case shipmentStatus.requestCancel:
      return classNameColor
        ? "bg-status-error-bg text-status-error-fg"
        : solid.error;
  }
  return classNameColor
    ? "bg-status-success-bg text-status-success-fg"
    : solid.success;
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
      return "bg-status-success-bg text-status-success-fg";
    case shipmentPaymentStatus.notPaid:
      return "bg-status-error-bg text-status-error-fg";
    case shipmentPaymentStatus.pending:
      return "bg-status-info-bg text-status-info-fg";
    case shipmentPaymentStatus.settled:
      return "bg-status-success-bg text-status-success-fg";
    case shipmentPaymentStatus.block:
      return "bg-status-error-bg text-status-error-fg";
  }
  return "bg-status-info-bg text-status-info-fg";
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
export const toShipmentTypeColor = () =>
  "bg-status-info-bg text-status-info-fg";
export const toShippingFilterTypeColor = (value: string) =>
  value === "cashOnDelivery"
    ? "bg-status-warning-bg text-status-warning-fg"
    : value === "international"
      ? "bg-status-success-bg text-status-success-fg"
      : "bg-status-info-bg text-status-info-fg";
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
  user.role === userRoles.user &&
  canViewShipments(user) &&
  hasOperationPermission("shipments", "create", user);
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
    address = value.address || {},
    street = splitShipmentStreet(address.street);
  return {
    [`${prefix}Id`]: value.id,
    [`${prefix}Name`]: value.fullName || "",
    [`${prefix}Email`]: value.email || "",
    [`${prefix}Phone`]: phone.number,
    [`${prefix}PhoneCountry`]: phone.code,
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
    ...(value[`${prefix}Email`] ? { email: value[`${prefix}Email`] } : {}),
    address,
  };
}
/** A delayed saved-contact read must not replace edits made since selection. */
export function mergeSavedShipmentContact(
  incoming: Record<string, unknown>,
  initial: Record<string, unknown>,
  current: Record<string, unknown>,
  prefix: "sender" | "receiver",
) {
  const changed = (suffix: string) =>
    current[`${prefix}${suffix}`] !== initial[`${prefix}${suffix}`];
  const geographyChanged = ["CountryId", "StateId", "CityId"].some(changed);
  const phoneChanged = ["Phone", "PhoneCountry"].some(changed);
  return Object.fromEntries(
    Object.entries(incoming).filter(([key]) => {
      const suffix = key.slice(prefix.length);
      if (current[key] !== initial[key]) return false;
      if (phoneChanged && ["Phone", "PhoneCountry"].includes(suffix))
        return false;
      return !(
        geographyChanged &&
        [
          "CountryId",
          "CountryName",
          "CountryCode",
          "StateId",
          "StateName",
          "CityId",
          "CityName",
          "Street",
          "NationalAddress",
          "ZipCode",
        ].includes(suffix)
      );
    }),
  );
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
    if (
      id &&
      id !== "new" &&
      !(prefix === "sender" && value.fulfillmentSource === "warehouse")
    )
      payload[`${prefix}Id`] = id;
    for (const suffix of ["Email", "ZipCode"])
      if (value[`${prefix}${suffix}`])
        payload[`${prefix}${suffix}`] = value[`${prefix}${suffix}`];
    payload[`${prefix}Phone`] = numericShipmentText(
      `${value[`${prefix}PhoneCountry`] || "+966"}-${value[`${prefix}Phone`] || ""}`,
    );
    if (value[`${prefix}NationalAddress`])
      payload[`${prefix}Street`] =
        `${payload[`${prefix}Street`] || ""}${value.shippingCompanyId === "66002f5c07d4cc8bca3eb0e0" ? "-" : nationalAddressSeparator}${value[`${prefix}NationalAddress`]}`;
  }
  if (payload.isCod) payload.codPrice = Number(value.codPrice);
  if (value.couponCodeId) {
    payload.couponCodeId = value.couponCodeId;
    payload.couponCode = value.couponCode;
  }
  if (value.method !== shippingTypes.local && value.imageUrl)
    payload.imageUrl = value.imageUrl;
  if (value.returnedFromShipmentId) {
    payload.returnedFromShipmentId = value.returnedFromShipmentId;
    payload.orderReturned = true;
    if (value.userId) payload.userId = value.userId;
  }
  if (value.fulfillmentSource === "warehouse") {
    payload.warehouseId = value.warehouseId;
    payload.products = (value.warehouseItems || [])
      .filter((item) => item.product && item.productId)
      .map((item) => ({
        title: item.product.name,
        price: Number(item.product.unitPrice),
        quantity: item.quantity,
        warehouseProductId: item.productId,
      }));
  }
  return payload;
}

/** The comparison request is carrier-neutral. Creation reuses this exact body. */
export function shipmentCompaniesReviewValues(
  value: ShipmentFormValues,
): ReviewShipmentCompaniesApiArg {
  const neutral = { ...value, shippingCompanyId: "", shippingCompany: null };
  const {
    shippingCompanyId: _carrier,
    quoteId: _quote,
    userId: _owner,
    ...payload
  } = compressShipment(neutral);
  for (const prefix of ["sender", "receiver"] as const) {
    for (const kind of ["Country", "State", "City"] as const) {
      const entity = value[`${prefix}${kind}`];
      const name = entity?.name
        ? typeof entity.name === "string"
          ? entity.name
          : entity.name.en || displayName(entity.name)
        : value[`${prefix}${kind}Name`];
      if (name) payload[`${prefix}${kind}Name`] = name;
    }
    if (value[`${prefix}StateId`])
      payload[`${prefix}StateId`] = value[`${prefix}StateId`];
  }
  return payload;
}
export type ReceiverCarrierReview = {
  key: string;
  response?: ReviewShipmentCompaniesApiResponse;
  error?: string;
};
export function isShipmentCompaniesReview(
  value: unknown,
): value is ReviewShipmentCompaniesApiResponse {
  const response = value as ReviewShipmentCompaniesApiResponse;
  if (
    !Array.isArray(response?.suitableCompanies) ||
    !Array.isArray(response?.unsuitableCompanies)
  )
    return false;
  const rows = [...response.suitableCompanies, ...response.unsuitableCompanies];
  const ids = rows.map((row) => row?.shippingCompany?.id);
  return (
    ids.every((id) => typeof id === "string" && !!id) &&
    new Set(ids).size === ids.length &&
    response.unsuitableCompanies.every(
      (row) =>
        Array.isArray(row.reasons) &&
        row.reasons.every(
          (reason) =>
            typeof reason?.code === "string" &&
            typeof reason?.message === "string",
        ),
    )
  );
}
export type ShipmentCarrierChoice = {
  shippingCompany: ReviewedShipmentCompany;
  eligible: boolean;
  total: number;
  reasons: { key: string; code?: string; message?: string }[];
};
export function shipmentCarrierChoices(
  reviews: ReceiverCarrierReview[],
  requireQuote = true,
): ShipmentCarrierChoice[] {
  const companies = new Map<string, ReviewedShipmentCompany>();
  for (const review of reviews) {
    [
      ...(review.response?.suitableCompanies || []),
      ...(review.response?.unsuitableCompanies || []),
    ].forEach((row) => {
      if (row.shippingCompany?.id)
        companies.set(row.shippingCompany.id, row.shippingCompany);
    });
  }
  return [...companies.values()]
    .map((shippingCompany) => {
      let total = 0;
      const reasons: ShipmentCarrierChoice["reasons"] = [];
      for (const review of reviews) {
        const offer = review.response?.suitableCompanies.find(
          (row) => row.shippingCompany.id === shippingCompany.id,
        );
        if (review.error)
          reasons.push({ key: review.key, message: review.error });
        else if (
          offer &&
          Number.isFinite(offer.calculation?.total) &&
          offer.calculation.total >= 0 &&
          (!requireQuote ||
            (typeof offer.quoteId === "string" && !!offer.quoteId))
        )
          total += offer.calculation.total;
        else {
          const rejection = review.response?.unsuitableCompanies.find(
            (row) => row.shippingCompany.id === shippingCompany.id,
          );
          reasons.push(
            ...(rejection?.reasons.length
              ? rejection.reasons.map((reason) => ({
                  key: review.key,
                  ...reason,
                }))
              : [{ key: review.key }]),
          );
        }
      }
      return {
        shippingCompany,
        total,
        eligible: reviews.length > 0 && reasons.length === 0,
        reasons,
      };
    })
    .sort(
      (a, b) =>
        Number(b.eligible) - Number(a.eligible) ||
        (a.eligible
          ? a.total - b.total
          : (a.shippingCompany.name || "").localeCompare(
              b.shippingCompany.name || "",
            )),
    );
}
export const carrierUnsuitableReason = {
  METHOD_NOT_SUPPORTED: "CARRIER_REASON_METHOD",
  SENDER_COUNTRY_NOT_SUPPORTED: "CARRIER_REASON_SENDER_COUNTRY",
  SENDER_STATE_NOT_SUPPORTED: "CARRIER_REASON_SENDER_STATE",
  SENDER_CITY_NOT_SUPPORTED: "CARRIER_REASON_SENDER_CITY",
  RECEIVER_COUNTRY_NOT_SUPPORTED: "CARRIER_REASON_RECEIVER_COUNTRY",
  RECEIVER_STATE_NOT_SUPPORTED: "CARRIER_REASON_RECEIVER_STATE",
  RECEIVER_CITY_NOT_SUPPORTED: "CARRIER_REASON_RECEIVER_CITY",
  ARABIC_ADDRESS_NOT_SUPPORTED: "CARRIER_REASON_ENGLISH",
} as const;
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
    const phone = splitShipmentUserPhone(flat[`${from}Phone`] || "");
    value[`${to}Phone`] = phone.number;
    value[`${to}PhoneCountry`] = phone.code;
    const address = splitShipmentStreet(flat[`${from}Street`]);
    value[`${to}Street`] = address.street;
    value[`${to}NationalAddress`] = address.nationalAddress;
    value[`${to}Id`] = "new";
  }
  for (const field of [
    "senderPhone1",
    "senderPhoneCountry1",
    "receiverPhone1",
    "receiverPhoneCountry1",
  ])
    delete value[field];
  delete value.id;
  value.shippingCompanyId = "";
  value.shippingCompany = null;
  value.fulfillmentSource = "external";
  value.warehouseId = "";
  value.warehouseItems = [];
  value.orderReturned = true;
  value.returnedFromShipmentId = shipment.id;
  value.isCod = false;
  value.codPrice = 0;
  value.description = `مرتجعة: ${flat.description || ""}`;
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

/** Refresh only carrier names. Canonical IDs and all editable contact fields stay intact. */
export function shipmentCarrierValues(
  values: ShipmentFormValues,
  company: IShippingCompany,
): ShipmentFormValues {
  const next = structuredClone(values);
  next.shippingCompanyId = company.id;
  next.shippingCompany = structuredClone(company);
  const update = (contact: object, prefix: "sender" | "receiver") => {
    for (const kind of ["Country", "State", "City"] as const) {
      const entity = contact[`${prefix}${kind}`];
      contact[`${prefix}${kind}Name`] = shippingGeoName(
        entity,
        company.id,
        kind.toLowerCase() as "country" | "state" | "city",
      );
    }
  };
  update(next, "sender");
  update(next, "receiver");
  next.receivers.forEach((receiver) => update(receiver, "receiver"));
  return next;
}

export function shipmentWarehouseSnapshot(
  warehouse: IWarehouse,
): ShipmentWarehouse {
  return {
    id: warehouse.id,
    name: warehouse.name,
    mapAddress: warehouse.mapAddress,
    pickup: warehouse.pickup ? structuredClone(warehouse.pickup) : undefined,
  };
}

/** Warehouse pickup is immutable in the merchant shipment editor. */
export function warehouseSenderValues(
  warehouse?: ShipmentWarehouse,
): Partial<ShipmentFormValues> {
  const pickup = warehouse?.pickup,
    phone = (pickup?.phone || "").split("-");
  return {
    senderId: "",
    senderName: warehouse?.name || "",
    senderEmail: pickup?.email || "",
    senderPhoneCountry: phone.length > 1 ? phone[0] : "",
    senderPhone: phone.length > 1 ? phone.slice(1).join("") : "",
    senderCountryId: pickup?.countryId || "",
    senderStateId: pickup?.stateId || "",
    senderCityId: pickup?.cityId || "",
    senderCountryName: "",
    senderCountryCode: "",
    senderStateName: "",
    senderCityName: "",
    senderStreet: pickup?.street || "",
    senderZipCode: pickup?.zipCode || "",
    senderNationalAddress: pickup?.nationalAddress || "",
    senderCountry: null,
    senderState: null,
    senderCity: null,
  } as Partial<ShipmentFormValues>;
}
