import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { FormProvider, Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { canEditCustomerPrices } from "../Utils";
import IMerchant from "../../merchants-app/models/IMerchant";
import IShippingCompany from "../../shipping-companies-app/models/IShippingCompany";
import CustomerPricesModel, {
  CustomerPricesForm,
  customerPricesPayload,
} from "../models/CustomerPricesModel";
import customerPricesSchema from "../models/CustomerPricesSchema";
import { useUpdateAffiliateCustomerPricesMutation } from "../AffiliateMerchantsApi";
import { useLazyGetMerchantQuery } from "../../merchants-app/MerchantsApi";
export default function CustomerPricesDialog({
  affiliate,
  customer,
  carriers,
  onClose,
}: {
  affiliate: IMerchant;
  customer: IMerchant;
  carriers: IShippingCompany[];
  onClose: () => void;
}) {
  const { t } = useTranslation("affiliateMerchantsApp"),
    user = useAppSelector(selectUser),
    [defaults] = useState(() =>
      CustomerPricesModel(affiliate, customer, carriers),
    ),
    methods = useForm<CustomerPricesForm>({
      defaultValues: defaults,
      resolver: zodResolver(customerPricesSchema(t)),
      mode: "onChange",
    }),
    [update, updating] = useUpdateAffiliateCustomerPricesMutation(),
    [getCustomer] = useLazyGetMerchantQuery(),
    [error, setError] = useState<string>(),
    busy = methods.formState.isSubmitting || updating.isLoading,
    allowed = canEditCustomerPrices(user);
  const submit = methods.handleSubmit(async (values) => {
    if (!allowed || updating.isLoading) return;
    setError(undefined);
    try {
      const current = await getCustomer(customer.id, false).unwrap();
      if (current.referredById && current.referredById !== affiliate.id)
        throw new Error("owner");
      await update({
        customerId: customer.id,
        affiliateId: affiliate.id,
        prices: customerPricesPayload(values),
      }).unwrap();
      onClose();
    } catch {
      setError(t("SAVE_ERROR"));
    }
  });
  return (
    <Dialog
      open
      fullWidth
      maxWidth="md"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <FormProvider {...methods}>
        <DialogTitle>
          {t("EDIT_CUSTOMER_PRICES_TITLE", {
            customer:
              `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
              customer.email,
          })}
        </DialogTitle>
        <DialogContent className="space-y-24">
          <Typography>{t("EDIT_CUSTOMER_PRICES_MESSAGE")}</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {defaults.prices.map((row, index) => (
            <div
              key={row.shippingCompanyId}
              className="space-y-12 border-b-1 pb-16"
              data-testid={`customer-price-${row.shippingCompanyId}`}
            >
              <Typography className="font-bold">{row.name}</Typography>
              {(["local", "cod"] as const)
                .filter((key) => row[`${key}Enabled`])
                .map((key) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-12"
                  >
                    <TextField
                      label={t(
                        key === "local"
                          ? "SHIPPING_COMPANY_LOCAL_COST"
                          : "SHIPPING_COMPANY_COD_COST",
                      )}
                      value={
                        row[key === "local" ? "mainLocalPrice" : "mainCodPrice"]
                      }
                      disabled
                      fullWidth
                    />
                    <Controller
                      name={`prices.${index}.${key}Profits`}
                      control={methods.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          label={t(
                            key === "local"
                              ? "PROFITS_LOCAL_COST"
                              : "PROFITS_COD_COST",
                          )}
                          type="number"
                          value={
                            Number.isFinite(field.value) ? field.value : ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? NaN
                                : Number(e.target.value),
                            )
                          }
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          disabled={!allowed || busy}
                          fullWidth
                        />
                      )}
                    />
                    <TextField
                      label={t(
                        key === "local" ? "FINAL_LOCAL_COST" : "FINAL_COD_COST",
                      )}
                      value={
                        row[
                          key === "local" ? "mainLocalPrice" : "mainCodPrice"
                        ] +
                        (methods.watch(`prices.${index}.${key}Profits`) || 0)
                      }
                      disabled
                      fullWidth
                    />
                  </div>
                ))}
            </div>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>
            {t("CANCEL")}
          </Button>
          <LoadingButton
            loading={busy}
            disabled={!allowed || !defaults.prices.length}
            onClick={() => submit()}
            data-testid="save-customer-prices"
          >
            {t("SAVE")}
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
