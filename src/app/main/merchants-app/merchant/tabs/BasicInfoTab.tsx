import { Controller, useFormContext } from "react-hook-form";
import { TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MerchantForm } from "../../models/MerchantSchema";
import AddressSection from "../sections/AddressSection";
export default function BasicInfoTab({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation("merchantsApp"),
    { control } = useFormContext<MerchantForm>();
  return (
    <div className="space-y-16 max-w-3xl mx-auto">
      <Typography variant="h6">{t("MERCHANT_PERSONAL_INFO")}</Typography>
      {(
        [
          "firstName",
          "lastName",
          "companyName",
          "email",
          "phoneCountry",
          "phone",
          "taxNumber",
        ] as const
      ).map((name) => (
        <Controller
          key={name}
          name={name}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value || ""}
              fullWidth
              disabled={disabled}
              required={["firstName", "lastName", "email"].includes(name)}
              type={name === "email" ? "email" : "text"}
              label={t(
                {
                  firstName: "FIRST_NAME",
                  lastName: "LAST_NAME",
                  companyName: "COMPANY_NAME",
                  email: "EMAIL",
                  phoneCountry: "DIAL_CODE",
                  phone: "PHONE_NUMBER",
                  taxNumber: "TAX_NUMBER",
                }[name],
              )}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      ))}
      <AddressSection disabled={disabled} />
    </div>
  );
}
