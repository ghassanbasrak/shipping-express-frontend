import {
  Alert,
  Button,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TopupRequestForm } from "../../models/TopupRequestSchema";
import { topupTotals } from "../../Utils";
import MediaInput from "app/shared-components/media-input/MediaInput";
import { MediaInputTypes } from "app/shared-components/media-input/Utils";
import Currency, { getCurrentCurrency } from "../../../utils/currencyFormatter";
export default function BasicInfoTab({
  disabled,
  submit,
  error,
  onUploadBusy,
}: {
  disabled: boolean;
  submit: React.ReactNode;
  error?: string;
  onUploadBusy: (busy: boolean) => void;
}) {
  const { t } = useTranslation("topupRequestsApp"),
    { control, watch } = useFormContext<TopupRequestForm>(),
    totals = topupTotals(watch("amount")),
    method = watch("method");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-24">
      <div className="lg:col-span-3 space-y-24">
        <Typography className="text-20 font-semibold">
          {t("CHOOSE_METHOD")}
        </Typography>
        <Controller
          name="method"
          control={control}
          render={({ field }) => (
            <RadioGroup
              {...field}
              aria-label={t("CHOOSE_METHOD")}
              className="grid grid-cols-1 sm:grid-cols-2 gap-12"
            >
              {[
                ["online", "ONLINE_PAYMENT", "ONLINE_DESCRIPTION"],
                ["bankTransfer", "BANK_TRANSFER", "BANK_DESCRIPTION"],
              ].map(([value, title, description]) => (
                <Paper
                  key={value}
                  variant="outlined"
                  className="rounded-16 overflow-hidden"
                  sx={{
                    borderColor: method === value ? "primary.main" : "divider",
                    bgcolor:
                      method === value ? "action.selected" : "background.paper",
                  }}
                >
                  <FormControlLabel
                    className="m-0 p-12 items-start w-full"
                    value={value}
                    disabled={disabled}
                    control={<Radio />}
                    label={
                      <div className="pt-8 pe-8">
                        <Typography className="font-semibold">
                          {t(title)}
                        </Typography>
                        <Typography
                          className="text-13 mt-4"
                          color="text.secondary"
                        >
                          {t(description)}
                        </Typography>
                      </div>
                    }
                  />
                </Paper>
              ))}
            </RadioGroup>
          )}
        />
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
              label={t(
                method === "online"
                  ? "GROSS_ONLINE_AMOUNT"
                  : "GROSS_TRANSFER_AMOUNT",
              )}
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
        {method === "bankTransfer" && (
          <div className="space-y-20">
            <Alert severity="info">{t("TRANSFER_INSTRUCTIONS")}</Alert>
            <Controller
              name="transactionReference"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  disabled={disabled}
                  label={t("TRANSFER_REFERENCE")}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <MediaInput
              type={MediaInputTypes.file}
              accept="image/*,.pdf"
              name="transactionImageUrl"
              label={t("TRANSFER_RECEIPT")}
              onBusy={onUploadBusy}
              disabled={disabled}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  minRows={3}
                  disabled={disabled}
                  label={t("TRANSFER_NOTES")}
                />
              )}
            />
          </div>
        )}
      </div>
      <Paper
        variant="outlined"
        className="lg:col-span-2 p-24 rounded-16 space-y-16 self-start"
      >
        <Typography variant="h6">{t("TRANSACTION_DETAILS")}</Typography>
        {[
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
        <Typography className="text-13" color="text.secondary">
          {t(method === "online" ? "ONLINE_CREDIT_HINT" : "BANK_CREDIT_HINT")}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {submit}
      </Paper>
    </div>
  );
}
