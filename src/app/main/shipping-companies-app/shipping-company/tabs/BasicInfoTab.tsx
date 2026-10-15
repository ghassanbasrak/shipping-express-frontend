import {
  Box,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import MediaInput from "app/shared-components/media-input/MediaInput";
import { getCurrentCurrency } from "src/app/main/utils/currencyFormatter";
import IShippingCompany from "../../models/IShippingCompany";
import {
  shippingMethods,
  toShippingMethodTitle,
  toShippingMethodColor,
  changeShippingMethods,
} from "../../Utils";
import ShippingCompanySummary from "../sections/ShippingCompanySummary";

function BasicInfoTab({
  shippingCompany,
  disabled = false,
}: {
  shippingCompany?: IShippingCompany;
  disabled?: boolean;
}) {
  const { t } = useTranslation("shippingCompaniesApp");
  const { control, watch, setValue } = useFormContext<IShippingCompany>();
  const { id, shippingMethods: methods = [], logoUrl, iconUrl } = watch();

  function sectionTitle(title: string) {
    return (
      <Box
        component="div"
        className="py-8 px-16 my-16 w-full rounded-lg"
        sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}
      >
        <Typography className="text-17 font-bold">{t(title)}</Typography>
      </Box>
    );
  }

  function numberField(
    name: keyof IShippingCompany,
    title: string,
    required = false,
    unit = getCurrentCurrency(),
  ) {
    return (
      <Controller
        key={name}
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            value={typeof field.value === "number" ? field.value : ""}
            onChange={(event) =>
              field.onChange(
                event.target.value === ""
                  ? undefined
                  : (event.target as HTMLInputElement).valueAsNumber,
              )
            }
            className="mt-8 mb-16"
            label={t(title)}
            fullWidth
            required={required}
            type="number"
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            inputProps={{ step: "any", dir: "ltr" }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{unit}</InputAdornment>
              ),
            }}
          />
        )}
      />
    );
  }

  return (
    <div>
      <fieldset disabled={disabled} className="border-0 p-0 m-0 min-w-0">
        {sectionTitle("SHIPPING_COMPANY_DETAILS")}
        {(["name", "serviceName"] as const).map((name) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                className="mt-8 mb-16"
                fullWidth
                required
                disabled={name === "serviceName" && Boolean(id)}
                label={t(name === "name" ? "COMPANY_NAME" : "SERVICE_NAME")}
                error={!!fieldState.error}
                helperText={
                  fieldState.error?.message ||
                  (name === "serviceName" ? t("SERVICE_NAME_HINT") : undefined)
                }
              />
            )}
          />
        ))}
        <div className="flex flex-wrap gap-16 mb-8">
          {(["hasState", "isEnglish"] as const).map((name) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={t(name === "hasState" ? "HAS_STATE" : "IS_ENGLISH")}
                  control={
                    <Checkbox
                      {...field}
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                />
              )}
            />
          ))}
        </div>
        {numberField("returnFees", "RETURN_FEES")}
        <Controller
          name="shippingMethods"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <div className="flex flex-wrap gap-8 my-16">
                {Object.values(shippingMethods).map((method) => (
                  <FormControlLabel
                    key={method}
                    sx={{
                      bgcolor: alpha(toShippingMethodColor(method), 0.15),
                      borderRadius: 1,
                      px: 1,
                    }}
                    label={t(toShippingMethodTitle(method))}
                    control={
                      <Checkbox
                        name={`method-${method}`}
                        checked={(field.value || []).includes(method)}
                        disabled={
                          disabled ||
                          (method === shippingMethods.cashOnDelivery &&
                            !methods.includes(shippingMethods.local))
                        }
                        onChange={(_, checked) =>
                          field.onChange(
                            changeShippingMethods(
                              field.value || [],
                              method,
                              checked,
                            ),
                          )
                        }
                      />
                    }
                  />
                ))}
              </div>
              {fieldState.error && (
                <Typography color="error" className="mb-16">
                  {fieldState.error.message}
                </Typography>
              )}
            </div>
          )}
        />
        {methods.includes(shippingMethods.international) && (
          <>
            {sectionTitle("INTERNATIONAL_SHIPPING")}
            {numberField(
              "internationalProfitsRate",
              "INTERNATIONAL_PROFITS_RATE",
              false,
              "%",
            )}
            {numberField(
              "internationalProfitsExtras",
              "INTERNATIONAL_PROFITS_EXTRAS",
            )}
          </>
        )}
        {methods.includes(shippingMethods.local) && (
          <>
            {sectionTitle("LOCAL_SHIPPING")}
            {numberField("localPrice", "LOCAL_PRICE", true)}
            {numberField("maxWeight", "MAXIMUM_WEIGHT", true, t("KG"))}
            {numberField("extraWeightPrice", "EXTRA_WEIGHT_PRICE", true)}
          </>
        )}
        {methods.includes(shippingMethods.cashOnDelivery) && (
          <>
            {sectionTitle("CASH_ON_DELIVERY_SERVICE")}
            {numberField("codPrice", "CASH_ON_DELIVERY_SERVICE_PRICE", true)}
          </>
        )}
        {sectionTitle("FEES")}
        {numberField("shipmentFees", "SHIPMENT_FEES")}
        {numberField("shipmentCodFees", "SHIPMENT_COD_FEES")}
        {numberField("shipmentExtraWeightFees", "SHIPMENT_EXTRA_FEES")}
        {numberField("shipmentReturnFees", "SHIPMENT_RETURN_FEES")}
        {numberField("fuelPercentage", "FUEL_FEES_PERCENTAGE", false, "%")}
        {sectionTitle("APPEARANCE_CONFIG")}
        <div className="flex flex-col sm:flex-row gap-16 my-16">
          {(["logoUrl", "iconUrl"] as const).map((name) => (
            <div
              key={name}
              className="flex-1"
              data-testid={`shipping-company-${name}`}
            >
              <Typography className="text-15 font-semibold mb-8">
                {t(name === "logoUrl" ? "LOGO_IMAGE" : "ICON_IMAGE")}
              </Typography>
              <MediaInput
                name={name}
                label={t(name === "logoUrl" ? "UPLOAD_LOGO" : "UPLOAD_ICON")}
                imageUrl={name === "logoUrl" ? logoUrl : iconUrl}
                required
                disabled={disabled}
                onUploadDone={(url) =>
                  setValue(name, url, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                onReset={() =>
                  setValue(name, "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
          ))}
        </div>
        <Controller
          name="color"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              className="mt-8 mb-16"
              label={t("COLOR")}
              type="color"
              fullWidth
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      </fieldset>
      {id && <ShippingCompanySummary shippingCompany={shippingCompany} />}
    </div>
  );
}
export default BasicInfoTab;
