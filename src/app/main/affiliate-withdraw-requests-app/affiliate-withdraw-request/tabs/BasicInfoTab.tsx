import { Alert, InputAdornment, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { getCurrentCurrency } from "../../../utils/currencyFormatter";
import { AffiliateWithdrawRequestForm } from "../../models/AffiliateWithdrawRequestSchema";
export default function BasicInfoTab({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation("affiliateWithdrawRequestsApp"),
    {
      control,
      formState: { errors },
    } = useFormContext<AffiliateWithdrawRequestForm>();
  return (
    <div className="space-y-16">
      {!disabled && errors.availableBalance && (
        <Alert severity="error">{t("NO_AVAILABLE_BALANCE")}</Alert>
      )}
      <Controller
        name="amount"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label={t("AMOUNT")}
            disabled={disabled}
            fullWidth
            required
            type="number"
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {getCurrentCurrency()}
                </InputAdornment>
              ),
            }}
            onChange={(event) =>
              field.onChange(
                event.target.value === "" ? "" : Number(event.target.value),
              )
            }
          />
        )}
      />
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            value={field.value || ""}
            label={t("REQUEST_NOTES")}
            disabled={disabled}
            fullWidth
            multiline
            rows={4}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />
    </div>
  );
}
