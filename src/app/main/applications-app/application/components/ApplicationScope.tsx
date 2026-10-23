import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import IApplication from "../../models/IApplication";
import {
  applicationFeatureCanWrite,
  toApplicationFeatureTitle,
  toApplicationFeatureColor,
} from "../../Utils";
export default function ApplicationScope({
  feature,
  index,
  onToggle,
  disabled = false,
}: {
  feature: string;
  index: number;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation("applicationsApp"),
    { control, watch, setValue } = useFormContext<IApplication>(),
    scope = (watch("scopes") || [])[index],
    enabled = index >= 0;
  const canWrite = applicationFeatureCanWrite(feature) || Boolean(scope?.write);
  return (
    <Box
      className="border-1 rounded-8 p-16 space-y-12 min-w-0"
      data-testid={`application-scope-${feature}`}
      sx={{
        bgcolor: (theme) =>
          enabled
            ? theme.palette.background.paper
            : theme.palette.background.default,
      }}
    >
      <div className="flex items-center justify-between gap-8">
        <Chip
          label={t(toApplicationFeatureTitle(feature))}
          className={toApplicationFeatureColor(feature) + " text-white"}
          size="small"
        />
        <Checkbox
          checked={enabled}
          onChange={onToggle}
          disabled={disabled}
          data-testid={`enable-scope-${feature}`}
          inputProps={{
            "aria-label": t("ENABLE_SCOPE", {
              feature: t(toApplicationFeatureTitle(feature)),
            }),
          }}
        />
      </div>
      <div className="flex flex-wrap">
        {enabled ? (
          <Controller
            name={`scopes.${index}.read`}
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <FormControlLabel
                  label={t("READ")}
                  disabled={disabled || Boolean(scope?.write)}
                  control={
                    <Checkbox
                      name={field.name}
                      checked={!!field.value}
                      onChange={(_, value) => field.onChange(value)}
                      onBlur={field.onBlur}
                      data-testid={`read-scope-${feature}`}
                    />
                  }
                />
                {fieldState.error && (
                  <Box color="error.main">{fieldState.error.message}</Box>
                )}
              </div>
            )}
          />
        ) : (
          <FormControlLabel
            disabled
            label={t("READ")}
            control={<Checkbox checked={false} />}
          />
        )}
        {canWrite &&
          (enabled ? (
            <Controller
              name={`scopes.${index}.write`}
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t("WRITE")}
                  disabled={disabled}
                  control={
                    <Checkbox
                      name={field.name}
                      checked={!!field.value}
                      onBlur={field.onBlur}
                      onChange={(_, value) => {
                        field.onChange(value);
                        if (value)
                          setValue(`scopes.${index}.read`, true, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                      }}
                      data-testid={`write-scope-${feature}`}
                    />
                  }
                />
              )}
            />
          ) : (
            <FormControlLabel
              disabled
              label={t("WRITE")}
              control={<Checkbox checked={false} />}
            />
          ))}
      </div>
      {enabled ? (
        <Controller
          name={`scopes.${index}.maxHourlyUsage`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ""}
              onChange={(event) =>
                field.onChange(
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
              type="number"
              fullWidth
              size="small"
              disabled={disabled}
              label={t("MAX_HOURLY_USAGE")}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              inputProps={{ "data-testid": `limit-scope-${feature}` }}
            />
          )}
        />
      ) : (
        <TextField
          value=""
          label={t("MAX_HOURLY_USAGE")}
          disabled
          size="small"
          fullWidth
        />
      )}
    </Box>
  );
}
