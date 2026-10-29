import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useGetShippingCompaniesQuery } from "../../../shipping-companies-app/ShippingCompaniesApi";
import { shippingMethods } from "../../../shipping-companies-app/Utils";
import { PlanFormValues } from "../../models/PlanSchema";

export default function EditPricesSection({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation("plansApp");
  const { control, getValues, setValue } = useFormContext<PlanFormValues>();
  const prices = useWatch({ control, name: "prices" }) || [];
  const { data, isFetching, isError, refetch } = useGetShippingCompaniesQuery({
    page: 0,
    pageSize: 1000,
  });
  // Include saved carriers missing from the lookup, so editing another carrier never drops them.
  const companies = [...(data?.results || [])];
  prices.forEach((price) => {
    if (!companies.some((company) => company.id === price.shippingCompanyId))
      companies.push(
        price.shippingCompany || {
          id: price.shippingCompanyId,
          name: price.shippingCompanyId,
        },
      );
  });
  return (
    <div className="space-y-16">
      <Typography className="text-18 font-semibold">
        {t("SHIPPING_COSTS")}
      </Typography>
      {isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("LOAD_COMPANIES_ERROR")}
        </Alert>
      )}
      {isFetching && <Typography>{t("LOADING")}</Typography>}
      {companies.map((company) => {
        const index = prices.findIndex(
          (price) => price.shippingCompanyId === company.id,
        );
        const row = prices[index];
        return (
          <Paper
            key={company.id}
            variant="outlined"
            className="p-16 space-y-12"
            data-testid={`plan-price-${company.id}`}
          >
            <FormControlLabel
              label={company.name || company.id}
              control={
                <Checkbox
                  checked={!!row?.active}
                  disabled={disabled}
                  inputProps={{ "aria-label": company.name || company.id }}
                  onChange={(_, active) => {
                    const current = getValues("prices") || [];
                    const at = current.findIndex(
                      (price) => price.shippingCompanyId === company.id,
                    );
                    const next = active
                      ? {
                          ...(at < 0 ? {} : current[at]),
                          shippingCompanyId: company.id,
                          active,
                          localPrice:
                            company.shippingMethods?.includes(
                              shippingMethods.local,
                            ) && company.localPrice > 0
                              ? company.localPrice
                              : null,
                          codPrice:
                            company.shippingMethods?.includes(
                              shippingMethods.cashOnDelivery,
                            ) && company.codPrice > 0
                              ? company.codPrice
                              : null,
                          returnFees: company.returnFees ?? null,
                        }
                      : {
                          ...current[at],
                          active: false,
                          localPrice: null,
                          codPrice: null,
                          internationalDiscountRate: null,
                          returnFees: null,
                        };
                    setValue(
                      "prices",
                      at < 0
                        ? [...current, next]
                        : current.map((price, i) => (i === at ? next : price)),
                      { shouldDirty: true, shouldValidate: true },
                    );
                  }}
                />
              }
            />
            {row && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
                {(
                  [
                    "localPrice",
                    "codPrice",
                    "returnFees",
                    "internationalDiscountRate",
                  ] as const
                )
                  .filter(
                    (name) =>
                      name === "returnFees" ||
                      row[name] != null ||
                      (name === "localPrice"
                        ? company.shippingMethods?.includes(
                            shippingMethods.local,
                          )
                        : name === "codPrice"
                          ? company.shippingMethods?.includes(
                              shippingMethods.cashOnDelivery,
                            )
                          : false),
                  )
                  .map((name) => (
                    <Controller
                      key={name}
                      name={`prices.${index}.${name}`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ""}
                          type="number"
                          disabled={disabled || !row.active}
                          fullWidth
                          label={t(
                            {
                              localPrice: "LOCAL_SHIPPING_COST",
                              codPrice: "COD_SHIPPING_COST",
                              returnFees: "RETURN_FEE",
                              internationalDiscountRate:
                                "INTERNATIONAL_SHIPPING_DISCOUNT",
                            }[name],
                          )}
                          inputProps={{ "data-price-field": name }}
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
            )}
          </Paper>
        );
      })}
    </div>
  );
}
