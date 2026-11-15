import { Controller, useFormContext } from "react-hook-form";
import { Autocomplete, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { storageType, toStorageTypeTitle } from "../Utils";
export default function StorageTypesField({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { control } = useFormContext(),
    { t } = useTranslation("storageApp");
  return (
    <Controller
      name="storageTypes"
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete
          multiple
          options={Object.values(storageType)}
          value={field.value || []}
          disabled={disabled}
          onBlur={field.onBlur}
          onChange={(_, value) => field.onChange(value)}
          getOptionLabel={(value) => t(toStorageTypeTitle(value))}
          renderInput={(params) => (
            <TextField
              {...params}
              required
              label={t("ALLOWED_STORAGE_TYPES")}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      )}
    />
  );
}
