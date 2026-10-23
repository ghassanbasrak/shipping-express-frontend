import { InputAdornment, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { getCurrentCurrency } from "../../../utils/currencyFormatter";
import IPackagingSupply from "../../models/IPackagingSupply";
import { PackageRequestFormValues } from "../../models/PackageRequestSchema";
import PackagingSupplyCard from "../components/PackagingSupplyCard";
import AddressSection from "../sections/AddressSection";
import PhoneField from "../components/PhoneField";
export default function BasicInfoTab({
  supplies,
  loading,
}: {
  supplies: IPackagingSupply[];
  loading: boolean;
}) {
  const { t } = useTranslation("packageRequestsApp"),
    {
      control,
      watch,
      setValue,
      formState: { errors },
    } = useFormContext<PackageRequestFormValues>();
  const ids = watch("productIds");
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
      <div className="md:col-span-2 space-y-16">
        <Typography className="text-20 font-semibold">
          {t("SELECT_PRODUCTS")}
        </Typography>
        {errors.productIds && (
          <Typography color="error">{errors.productIds.message}</Typography>
        )}
        {!loading && !supplies.length && (
          <Typography>{t("NO_SUPPLIES")}</Typography>
        )}
        {supplies.map((product) => (
          <PackagingSupplyCard
            key={product.id}
            product={product}
            selected={ids.includes(product.id)}
            disabled={loading}
            onSelect={() =>
              setValue(
                "productIds",
                ids.includes(product.id)
                  ? ids.filter((id) => id !== product.id)
                  : [...ids, product.id],
                { shouldDirty: true, shouldValidate: true },
              )
            }
          />
        ))}
      </div>
      <div className="space-y-16">
        <Typography className="font-semibold">{t("AMOUNT_TO_PAID")}</Typography>
        <Controller
          name="amount"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t("AMOUNT")}
              fullWidth
              disabled
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
              label={t("NOTES")}
              fullWidth
              multiline
              rows={3}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Typography className="text-20 font-semibold">
          {t("RECEIVER_DETAILS")}
        </Typography>
        <Controller
          name="fullName"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t("FULL_NAME")}
              required
              fullWidth
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <PhoneField
          name="phone"
          codeName="phoneCountry"
          label={t("PHONE_NUMBER")}
          required
        />
        <AddressSection />
      </div>
    </div>
  );
}
