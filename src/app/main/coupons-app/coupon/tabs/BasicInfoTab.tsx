import {
  Alert,
  Button,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useGetShippingCompaniesQuery } from "../../../shipping-companies-app/ShippingCompaniesApi";
import { getCurrentCurrency } from "src/app/main/utils/currencyFormatter";
import ICoupon from "../../models/ICoupon";
import { couponTypes, toCouponTypeTitle } from "../../Utils";

export default function BasicInfoTab({
  disabled = false,
}: {
  coupon?: ICoupon;
  disabled?: boolean;
}) {
  const { t } = useTranslation("couponsApp");
  const { control, watch } = useFormContext<ICoupon>();
  const { data, isError, refetch } = useGetShippingCompaniesQuery({
    page: 0,
    pageSize: 1000,
  });
  const type = watch("type"),
    companyId = watch("shippingCompanyId");
  return (
    <div className="space-y-16">
      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOOKUP_ERROR")}
        </Alert>
      )}
      <Controller
        name="shippingCompanyId"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            value={field.value || "all"}
            fullWidth
            select
            disabled={disabled}
            label={t("SHIPPING_COMPANY")}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            inputProps={{ "data-testid": "coupon-company" }}
          >
            <MenuItem value="all">{t("ALL")}</MenuItem>
            {(data?.results || []).map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
            {companyId &&
              companyId !== "all" &&
              !data?.results.some((company) => company.id === companyId) && (
                <MenuItem value={companyId}>{companyId}</MenuItem>
              )}
          </TextField>
        )}
      />
      <Controller
        name="code"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            required
            fullWidth
            disabled={disabled}
            label={t("COUPON_CODE")}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            inputProps={{ dir: "ltr" }}
          />
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
        <Controller
          name="expiresAt"
          control={control}
          render={({ field, fieldState }) => (
            <DatePicker
              value={field.value ? new Date(field.value) : null}
              disabled={disabled}
              minDate={new Date()}
              onChange={(value) =>
                field.onChange(
                  value && Number.isFinite(value.getTime())
                    ? value.toISOString()
                    : null,
                )
              }
              slotProps={{
                field: { clearable: true },
                textField: {
                  fullWidth: true,
                  name: "expiresAt",
                  label: t("EXPIRED_AT"),
                  error: !!fieldState.error,
                  helperText: fieldState.error?.message,
                },
              }}
            />
          )}
        />
        <Controller
          name="maxUsageCount"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ""}
              type="number"
              required
              fullWidth
              disabled={disabled}
              label={t("MAX_USAGE_COUNT")}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
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
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            >
              {Object.values(couponTypes).map((value) => (
                <MenuItem key={value} value={value}>
                  {t(toCouponTypeTitle(value))}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="value"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ""}
              type="number"
              fullWidth
              required
              disabled={disabled}
              label={t("VALUE")}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              inputProps={{ step: "any", dir: "ltr" }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {type === couponTypes.fixed ? getCurrentCurrency() : "%"}
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
      </div>
    </div>
  );
}
