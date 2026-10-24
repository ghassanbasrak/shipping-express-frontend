import { IShipmentCity } from "./models/ICity";

export { displayName } from "../countries-app/Utils";

export const citiesPath = (shippingCompanyId = "all", stateId = "all") =>
  `/cities/${shippingCompanyId}/${stateId || "all"}`;

export const shipmentCityPayload = (
  row: IShipmentCity,
  cityId = row.cityId,
) => ({
  cityId,
  shippingCompanyId: row.shippingCompanyId,
  name: row.name?.trim() || "",
  isActive: row.isActive ?? false,
});

export function changedShipmentCities(
  rows: IShipmentCity[] = [],
  previous: IShipmentCity[] = [],
) {
  return rows.filter((row) => {
    if (!row.id && !row._id && !row.name?.trim()) return false;
    const old = previous.find(
      (item) => item.shippingCompanyId === row.shippingCompanyId,
    );
    return (
      !old || old.name !== row.name?.trim() || old.isActive !== row.isActive
    );
  });
}
