import { shippingGeoName } from "../Utils";
import type { ShipmentFormValues } from "../models/ShipmentSchema";

export const shipmentSectionIds = [
  "type",
  "sender",
  "receiver",
  "carrier",
  "parcel",
  "payment",
] as const;
export type ShipmentSectionId = (typeof shipmentSectionIds)[number];

export function sectionOfField(key: string): ShipmentSectionId {
  if (key === "method") return "type";
  if (key.startsWith("sender")) return "sender";
  if (key.startsWith("receiver")) return "receiver";
  if (key === "shippingCompanyId") return "carrier";
  if (["isCod", "codPrice", "couponCode"].includes(key)) return "payment";
  return "parcel";
}

type MappedGeo = {
  shipmentCities?: { shippingCompanyId?: string; name?: string }[];
  shipmentStates?: { shippingCompanyId?: string; name?: string }[];
};

/**
 * Detects a carrier that certainly cannot serve one of the chosen addresses.
 * Entities without carrier mappings are treated as unknown, never as unsupported.
 */
export function carrierMissesAddress(
  carrier: { id?: string; hasState?: boolean },
  form: ShipmentFormValues,
) {
  const values = form as unknown as Record<string, MappedGeo | undefined> & {
    receivers?: Record<string, MappedGeo | undefined>[];
  };
  const parties: [MappedGeo | undefined, MappedGeo | undefined][] = [
    [values.senderCity, values.senderState],
    [values.receiverCity, values.receiverState],
    ...(values.receivers || []).map(
      (item): [MappedGeo | undefined, MappedGeo | undefined] => [
        item.receiverCity,
        item.receiverState,
      ],
    ),
  ];
  return parties.some(([city, state]) => {
    if (
      city?.shipmentCities?.length &&
      !shippingGeoName(city, carrier.id, "city")
    )
      return true;
    return (
      !!carrier.hasState &&
      !!state?.shipmentStates?.length &&
      !shippingGeoName(state, carrier.id, "state")
    );
  });
}
