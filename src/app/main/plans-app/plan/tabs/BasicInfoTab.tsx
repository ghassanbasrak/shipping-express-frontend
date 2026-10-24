import { Autocomplete, MenuItem, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import IPlan from "../../models/IPlan";
import { PlanFormValues } from "../../models/PlanSchema";
import { planStatus, toPlanStatusTitle } from "../../Utils";
import EditPricesSection from "../sections/EditPricesSection";

export default function BasicInfoTab({
  disabled = false,
}: {
  plan?: IPlan;
  disabled?: boolean;
}) {
  const { t } = useTranslation("plansApp");
  const { control } = useFormContext<PlanFormValues>();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
      <div className="space-y-16">
        <Typography className="text-18 font-semibold">
          {t("PLAN_DETAILS")}
        </Typography>
        {(["name", "description", "price", "status"] as const).map((name) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                fullWidth
                disabled={disabled}
                required={name !== "description"}
                select={name === "status"}
                type={name === "price" ? "number" : "text"}
                label={t(
                  {
                    name: "PLAN_NAME",
                    description: "PLAN_DESCRIPTION",
                    price: "PLAN_PRICE",
                    status: "STATUS",
                  }[name],
                )}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(event) =>
                  field.onChange(
                    name === "price"
                      ? event.target.value === ""
                        ? undefined
                        : Number(event.target.value)
                      : event.target.value,
                  )
                }
              >
                {name === "status" &&
                  Object.values(planStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {t(toPlanStatusTitle(status))}
                    </MenuItem>
                  ))}
              </TextField>
            )}
          />
        ))}
        <Controller
          name="features"
          control={control}
          render={({ field, fieldState }) => (
            <Autocomplete
              multiple
              freeSolo
              disabled={disabled}
              options={[]}
              value={field.value || []}
              onChange={(_, value) => field.onChange(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("FEATURES")}
                  required
                  placeholder={t("TYPE_MULTIPLE_TEXTS")}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  inputProps={{
                    ...params.inputProps,
                    "data-testid": "plan-features",
                  }}
                />
              )}
            />
          )}
        />
      </div>
      <div className="md:col-span-2">
        <EditPricesSection disabled={disabled} />
      </div>
    </div>
  );
}
