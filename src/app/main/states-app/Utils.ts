import { IShipmentState } from "./models/IState";

export { displayName } from "../countries-app/Utils";

export const statesPath = (shippingCompanyId = "all", countryId = "all") =>
  `/states/${shippingCompanyId}/${countryId || "all"}`;

export const shipmentStatePayload = (
  row: IShipmentState,
  stateId = row.stateId,
) => ({
  stateId,
  shippingCompanyId: row.shippingCompanyId,
  name: row.name?.trim() || "",
  isActive: row.isActive ?? false,
});

export function changedShipmentStates(
  rows: IShipmentState[] = [],
  previous: IShipmentState[] = [],
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
