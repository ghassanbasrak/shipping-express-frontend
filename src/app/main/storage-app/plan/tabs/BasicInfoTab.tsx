import { useTranslation } from "react-i18next";
import StorageField from "../../shared/StorageField";
export default function BasicInfoTab({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation("storageApp");
  return (
    <div className="space-y-20" data-testid="storage-plan-form">
      <StorageField
        name="name"
        label={t("NAME")}
        required
        disabled={disabled}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-16">
        <StorageField
          name="price"
          label={t("PRICE")}
          type="number"
          required
          disabled={disabled}
        />
        <StorageField
          name="discountPrice"
          label={t("DISCOUNTED_PRICE")}
          type="nullableNumber"
          helper={t("DISCOUNT_HINT")}
          disabled={disabled}
        />
        <StorageField
          name="durationDays"
          label={t("DURATION_DAYS")}
          type="number"
          required
          disabled={disabled}
        />
      </div>
      <StorageField
        name="featuresText"
        label={t("ALLOWED_STORAGE_TYPES")}
        type="textarea"
        required
        helper={t("NATIVE_FEATURES_HINT")}
        disabled={disabled}
      />
      <StorageField
        name="isActive"
        label={t("ACTIVE")}
        type="checkbox"
        disabled={disabled}
      />
    </div>
  );
}
