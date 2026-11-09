import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import StorageField from "../../shared/StorageField";
import WarehouseMap from "../../shared/WarehouseMap";
import PickupFields from "./PickupFields";
export default function BasicInfoTab({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation("storageApp"),
    { watch } = useFormContext();
  return (
    <div className="space-y-20" data-testid="warehouse-form">
      <StorageField
        name="name"
        label={t("NAME")}
        required
        disabled={disabled}
      />
      <StorageField
        name="address"
        label={t("ADDRESS")}
        type="textarea"
        required
        disabled={disabled}
      />
      <StorageField
        name="mapAddress"
        label={t("MAP_ADDRESS")}
        helper={t("MAP_ADDRESS_HINT")}
        disabled={disabled}
      />
      <WarehouseMap address={watch("mapAddress")} />
      <PickupFields disabled={disabled} />
      <StorageField
        name="information"
        label={t("WAREHOUSE_INFORMATION")}
        type="textarea"
        disabled={disabled}
      />
    </div>
  );
}
