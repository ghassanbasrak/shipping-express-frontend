import { MenuItem } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import StorageField from "../../shared/StorageField";
import StorageMerchantField from "../../shared/StorageMerchantField";
import { storageType, toStorageTypeTitle } from "../../Utils";
import type IWarehouse from "../../models/IWarehouse";
export default function BasicInfoTab({
  disabled,
  warehouses,
}: {
  disabled: boolean;
  warehouses: IWarehouse[];
}) {
  const { t } = useTranslation("storageApp"),
    { watch } = useFormContext(),
    warehouse = warehouses.find((w) => w.id === watch("warehouseId"));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-20">
      <StorageMerchantField disabled={disabled} />
      <StorageField
        name="warehouseId"
        label={t("WAREHOUSE")}
        required
        disabled={disabled}
      >
        {warehouses.map((w) => (
          <MenuItem key={w.id} value={w.id}>
            {w.name}
          </MenuItem>
        ))}
      </StorageField>
      <StorageField
        name="name"
        label={t("PRODUCT_NAME")}
        required
        disabled={disabled}
      />
      <StorageField name="sku" label={t("SKU")} disabled={disabled} />
      <StorageField
        name="quantity"
        label={t("QUANTITY")}
        type="number"
        required
        disabled={disabled}
      />
      <StorageField
        name="unitPrice"
        label={t("UNIT_PRICE")}
        type="number"
        required
        disabled={disabled}
      />
      <StorageField
        name="storageType"
        label={t("STORAGE_TYPE")}
        required
        disabled={disabled}
      >
        {Object.values(storageType).map((v) => (
          <MenuItem
            key={v}
            value={v}
            disabled={!warehouse?.storageTypes?.includes(v)}
          >
            {t(toStorageTypeTitle(v))}
          </MenuItem>
        ))}
      </StorageField>
    </div>
  );
}
