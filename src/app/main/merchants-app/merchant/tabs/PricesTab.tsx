import { useEffect } from "react";
import { Alert, Button, MenuItem, TextField, Typography } from "@mui/material";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useGetShippingCompaniesQuery } from "../../../shipping-companies-app/ShippingCompaniesApi";
import { MerchantForm } from "../../models/MerchantSchema";
import { merchantLoyaltyTypes, toMerchantLoyaltyTypeTitle } from "../../Utils";
export default function PricesTab({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation("merchantsApp"),
    { control, watch, getValues, setValue } = useFormContext<MerchantForm>(),
    { fields, append } = useFieldArray({ control, name: "prices" }),
    carriers = useGetShippingCompaniesQuery({ page: 0, pageSize: 500 }),
    loyalty = watch("loyaltyType");
  useEffect(() => {
    for (const carrier of carriers.currentData?.results || [])
      if (
        !getValues("prices").some(
          (price) => price.shippingCompanyId === carrier.id,
        )
      )
        append({ shippingCompanyId: carrier.id });
  }, [carriers.currentData]);
  return (
    <div className="space-y-16">
      <Controller
        name="loyaltyType"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            select
            fullWidth
            label={t("MERCHANT_TYPE")}
            disabled={disabled}
            onChange={(event) => {
              field.onChange(event);
              if (event.target.value === "normal")
                for (const [index, price] of getValues("prices").entries()) {
                  const carrier = carriers.currentData?.results.find(
                    (item) => item.id === price.shippingCompanyId,
                  );
                  if (!carrier) continue;
                  for (const key of ["localPrice", "codPrice"] as const)
                    setValue(
                      `prices.${index}.${key}`,
                      price[key] > 0 ? price[key] : carrier[key],
                      { shouldDirty: true, shouldValidate: true },
                    );
                }
            }}
          >
            {Object.values(merchantLoyaltyTypes).map((value) => (
              <MenuItem key={value} value={value}>
                {t(toMerchantLoyaltyTypeTitle(value))}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      {carriers.isError && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => carriers.refetch()}>{t("RETRY")}</Button>
          }
        >
          {t("LOOKUP_ERROR")}
        </Alert>
      )}
      {fields.map((price, index) => {
        const carrier =
          carriers.currentData?.results.find(
            (item) => item.id === price.shippingCompanyId,
          ) || price.shippingCompany;
        return (
          <div key={price.id} className="border rounded-8 p-16 space-y-16">
            <Typography className="font-semibold">
              {carrier?.name || price.shippingCompanyId}
            </Typography>
            {(["localPrice", "codPrice", "internationalDiscountRate"] as const)
              .filter(
                (key) =>
                  key !== "internationalDiscountRate" ||
                  (getValues(`prices.${index}.internationalDiscountRate`) ??
                    0) > 0,
              )
              .map((key) => (
                <Controller
                  key={key}
                  name={`prices.${index}.${key}`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      type="number"
                      fullWidth
                      disabled={disabled || loyalty !== "custom"}
                      label={t(
                        {
                          localPrice: "LOCAL_SHIPPING_COST",
                          codPrice: "COD_COST",
                          internationalDiscountRate:
                            "INTERNATIONAL_DISCOUNT_RATE",
                        }[key],
                      )}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                        )
                      }
                    />
                  )}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
