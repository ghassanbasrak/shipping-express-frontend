import { MenuItem, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import MediaInput from "app/shared-components/media-input/MediaInput";
import IAlert from "../../models/IAlert";
import {
  alertTypes,
  alertViewTypes,
  toAlertTypeTitle,
  toAlertViewTypeTitle,
} from "../../Utils";

export default function BasicInfoTab({
  disabled = false,
}: {
  alert?: IAlert;
  disabled?: boolean;
}) {
  const { t } = useTranslation("alertsApp");
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<IAlert>();
  const { type, viewType, imageUrl } = watch();
  return (
    <div className="space-y-16">
      <Controller
        name="type"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            select
            fullWidth
            required
            disabled={disabled}
            label={t("TYPE")}
            inputProps={{ "data-testid": "alert-type" }}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(event) => {
              field.onChange(event);
              if (event.target.value === alertTypes.onlyImage)
                setValue("viewType", alertViewTypes.popup, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
            }}
          >
            {Object.values(alertTypes).map((value) => (
              <MenuItem key={value} value={value}>
                {t(toAlertTypeTitle(value))}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        name="viewType"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            select
            fullWidth
            required
            disabled={disabled}
            label={t("VIEW_TYPE")}
            inputProps={{ "data-testid": "alert-viewType" }}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          >
            {Object.values(alertViewTypes)
              .filter(
                (value) =>
                  type !== alertTypes.onlyImage ||
                  value === alertViewTypes.popup,
              )
              .map((value) => (
                <MenuItem key={value} value={value}>
                  {t(toAlertViewTypeTitle(value))}
                </MenuItem>
              ))}
          </TextField>
        )}
      />
      <div className="flex flex-col sm:flex-row gap-24">
        {viewType === alertViewTypes.popup && (
          <div data-testid="alert-image" className="min-w-0">
            <MediaInput
              name="imageUrl"
              label={t("IMAGE")}
              imageUrl={imageUrl}
              disabled={disabled}
              onUploadDone={(url) =>
                setValue("imageUrl", url, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onReset={() =>
                setValue("imageUrl", "", {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            {errors.imageUrl && (
              <p className="text-red-500">{errors.imageUrl.message}</p>
            )}
          </div>
        )}
        {type === alertTypes.normal && (
          <div className="flex-1 space-y-16 w-full">
            {(["title", "content"] as const).map((name) => (
              <Controller
                key={name}
                name={name}
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    value={field.value || ""}
                    fullWidth
                    required
                    disabled={disabled}
                    label={t(name === "title" ? "TITLE" : "CONTENT")}
                    multiline={name === "content"}
                    rows={name === "content" ? 5 : undefined}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
