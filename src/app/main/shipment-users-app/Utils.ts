import type IShipmentUser from "./models/IShipmentUser";
import type { ShipmentUserFormValues } from "./models/ShipmentUserSchema";

export const shipmentUserTypes = {
  sender: "sender",
  receiver: "receiver",
} as const;
export const toShipmentUserTypeTitle = (type: string) =>
  type === shipmentUserTypes.receiver ? "RECEIVER" : "SENDER";
export const toShipmentUserTypeColor = (type: string): "error" | "success" =>
  type === shipmentUserTypes.receiver ? "success" : "error";
export const isShipmentUserType = (type: string) =>
  type === "all" ||
  Object.values(shipmentUserTypes).some((value) => value === type);
export const shipmentUsersPath = (type = "all") =>
  `/shipment-users/${isShipmentUserType(type) ? type : "all"}`;
export const nationalAddressSeparator = " - العنوان الوطني: ";

export function splitShipmentUserPhone(value = "", fallbackCode = "+966") {
  const separator = value.indexOf("-");
  if (value.startsWith("+") && separator > 0)
    return {
      code: value.slice(0, separator),
      number: value.slice(separator + 1).replace(/[^0-9]/g, ""),
    };
  if (value.startsWith(fallbackCode))
    return {
      code: fallbackCode,
      number: value.slice(fallbackCode.length).replace(/[^0-9]/g, ""),
    };
  return { code: fallbackCode, number: value };
}

export function toShipmentUserFormValues(
  value: IShipmentUser,
): ShipmentUserFormValues {
  const first = splitShipmentUserPhone(value.phone),
    second = splitShipmentUserPhone(value.phone1);
  const address = { ...(value.address || {}) };
  const parts = (address.street || "").split(nationalAddressSeparator);
  return {
    ...value,
    phone: first.number,
    phoneCountry: first.code,
    phone1: second.number,
    phoneCountry1: second.code,
    address: {
      ...address,
      street: parts[0],
      nationalAddress: parts.slice(1).join(nationalAddressSeparator),
    },
  };
}

export function toShipmentUserSaveValues(
  values: ShipmentUserFormValues,
): IShipmentUser {
  const address = values.address;
  const result: IShipmentUser = {
    id: values.id,
    fullName: values.fullName,
    type: values.type,
    phone: `${values.phoneCountry}-${values.phone}`,
    phone1: values.phone1 ? `${values.phoneCountry1}-${values.phone1}` : "",
    address: {
      countryId: address.countryId,
      stateId: address.stateId,
      cityId: address.cityId,
      street: address.nationalAddress
        ? `${address.street || ""}${nationalAddressSeparator}${address.nationalAddress}`
        : address.street,
      zipCode: address.zipCode,
    },
  };
  if (values.email) result.email = values.email;
  return result;
}
