import { Controller, useFormContext } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import type { MerchantStatisticsForm } from "../../models/MerchantStatisticsSchema";
export default function StatisticsDates({ namespace }: { namespace: string }) {
  const { t } = useTranslation(namespace);
  const { control, watch } = useFormContext<MerchantStatisticsForm>();
  const dateFrom = watch("dateFrom"),
    dateTo = watch("dateTo");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
      <Controller
        name="dateFrom"
        control={control}
        render={({ field, fieldState }) => (
          <DatePicker
            label={t("START_DATE")}
            value={field.value || null}
            onChange={field.onChange}
            maxDate={dateTo || undefined}
            slotProps={{
              textField: {
                name: field.name,
                onBlur: field.onBlur,
                fullWidth: true,
                error: !!fieldState.error,
                helperText: fieldState.error?.message,
              },
            }}
          />
        )}
      />
      <Controller
        name="dateTo"
        control={control}
        render={({ field, fieldState }) => (
          <DatePicker
            label={t("END_DATE")}
            value={field.value || null}
            onChange={field.onChange}
            minDate={dateFrom || undefined}
            maxDate={new Date()}
            slotProps={{
              textField: {
                name: field.name,
                onBlur: field.onBlur,
                fullWidth: true,
                error: !!fieldState.error,
                helperText: fieldState.error?.message,
              },
            }}
          />
        )}
      />
    </div>
  );
}
