import {
  Alert,
  Button,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TopupRequestForm } from "../../models/TopupRequestSchema";
import { topupTotals } from "../../Utils";
import Currency, { getCurrentCurrency } from "../../../utils/currencyFormatter";
export default function BasicInfoTab({
  disabled,
  submit,
  error,
}: {
  disabled: boolean;
  submit: React.ReactNode;
  error?: string;
}) {
  const { t } = useTranslation("topupRequestsApp"),
    { control, watch } = useFormContext<TopupRequestForm>(),
    totals = topupTotals(watch("amount"));
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-24">
      <div className="md:col-span-3">
        <Controller
          name="amount"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ""}
              fullWidth
              required
              autoFocus
              disabled={disabled}
              type="number"
              label={t("AMOUNT")}
              error={!!fieldState.error}
              helperText={fieldState.error?.message || t("TOPUP_BALANCE_HINT")}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {getCurrentCurrency()}
                  </InputAdornment>
                ),
              }}
              onChange={(event) =>
                field.onChange(
                  Number.isNaN(Number(event.target.value)) ||
                    event.target.value === ""
                    ? undefined
                    : Number(event.target.value),
                )
              }
            />
          )}
        />
      </div>
      <Paper variant="outlined" className="md:col-span-2 p-16 space-y-16">
        <Typography variant="h6">{t("TRANSACTION_DETAILS")}</Typography>
        {[
          ["SUBTOTAL", totals.total],
          ["PAYMENT_METHOD_FEES", totals.feeTotal],
          ["TAX", totals.taxTotal],
          ["TOPUP_AMOUNT", totals.amount],
          ["TOTAL", totals.total],
        ].map(([key, value]) => (
          <div className="flex flex-wrap justify-between gap-8" key={key}>
            <Typography>{t(String(key))}</Typography>
            <Typography
              className="font-semibold"
              data-testid={key === "TOPUP_AMOUNT" ? "topup-net" : undefined}
            >
              {Currency(Number(value))}
            </Typography>
          </div>
        ))}
        {error && <Alert severity="error">{error}</Alert>}
        {submit}
      </Paper>
    </div>
  );
}
