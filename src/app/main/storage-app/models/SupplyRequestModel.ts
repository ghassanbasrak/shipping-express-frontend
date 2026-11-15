import { supplyProductMode } from "../Utils";
export const newSupplyItem = () => ({
  mode: supplyProductMode.new as string,
  warehouseProductId: "",
  sku: "",
  name: "",
  quantity: 1,
  unitPrice: null as number | null,
  notes: "",
  storageType: "",
});
export default function SupplyRequestModel() {
  return { warehouseId: "", products: [newSupplyItem()] };
}
