import type IWarehouse from "./IWarehouse";
export default function WarehouseModel(value?: IWarehouse) {
  return {
    name: value?.name || "",
    storageTypes: value?.storageTypes || [],
    mapAddress: value?.mapAddress || "",
    information: value?.information || "",
    pickup: {
      phone: value?.pickup?.phone || "",
      email: value?.pickup?.email || "",
      countryId: value?.pickup?.countryId || "",
      stateId: value?.pickup?.stateId || "",
      cityId: value?.pickup?.cityId || "",
      street: value?.pickup?.street || "",
      nationalAddress: value?.pickup?.nationalAddress || "",
      zipCode: value?.pickup?.zipCode || "",
    },
  };
}
