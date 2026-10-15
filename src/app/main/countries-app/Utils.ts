import localeString from "src/app/main/utils/localeString";
import { LocaleString } from "src/app/main/utils/commonTypes";
import { IShipmentCountry } from "./models/ICountry";

export const displayName = (name?: string | LocaleString) =>
  typeof name === "string"
    ? name
    : localeString(name) || name?.en || name?.ar || "";

export const countriesPath = (shippingCompanyId = "all") =>
  `/countries/${shippingCompanyId}`;

export const shipmentCountryPayload = (
  row: IShipmentCountry,
  countryId = row.countryId,
) => ({
  countryId,
  shippingCompanyId: row.shippingCompanyId,
  name: row.name?.trim() || "",
  isActive: row.isActive ?? false,
});

export function changedShipmentCountries(
  rows: IShipmentCountry[] = [],
  previous: IShipmentCountry[] = [],
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
