import { InputAdornment, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { getCurrentCurrency } from "src/app/main/utils/currencyFormatter";
import StatisticsMerchantField from "../../../merchant-statistics-app/merchant-statistics/components/StatisticsMerchantField";
import StatisticsDates from "../../../merchant-statistics-app/merchant-statistics/components/StatisticsDates";
import type { MerchantStatisticsForm } from "../../models/MerchantStatisticsSchema";
export default function BasicInfoTab() {
  const { t } = useTranslation("merchantStatisticsNewApp");
  const { control } = useFormContext<MerchantStatisticsForm>();
  return (
    <div className="space-y-16">
      <Typography className="text-18 font-semibold">
        {t("TYPE_MERCHANT_DETAILS")}
      </Typography>
      <StatisticsMerchantField namespace="merchantStatisticsNewApp" />
      <StatisticsDates namespace="merchantStatisticsNewApp" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
        {(["bankTransferTotals", "otherFees"] as const).map((name) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                required
                fullWidth
                type="number"
                label={t(
                  name === "bankTransferTotals"
                    ? "BANK_TRANSFER_CHARGE_AMOUNT"
                    : "OTHER_CHARGE_AMOUNT",
                )}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                inputProps={{ step: "any" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {getCurrentCurrency()}
                    </InputAdornment>
                  ),
                }}
                onChange={(event) =>
                  field.onChange(
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                  )
                }
              />
            )}
          />
        ))}
      </div>
    </div>
  );
}
