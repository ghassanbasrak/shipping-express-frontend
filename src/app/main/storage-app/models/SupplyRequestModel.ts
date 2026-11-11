export const newSupplyItem = () => ({
  sku: "",
  name: "",
  quantity: 1,
  unitPrice: 0,
  notes: "",
  storageType: "",
});
export default function SupplyRequestModel() {
  return { warehouseId: "", products: [newSupplyItem()] };
}
