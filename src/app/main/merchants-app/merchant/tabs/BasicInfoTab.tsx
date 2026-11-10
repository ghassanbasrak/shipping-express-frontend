import { Controller, useFormContext } from "react-hook-form";
import { Paper, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MerchantForm } from "../../models/MerchantSchema";
import AddressSection from "../sections/AddressSection";
export default function BasicInfoTab({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation("merchantsApp"),
    { control } = useFormContext<MerchantForm>();
  return (
    <Paper
      variant="outlined"
      className="p-24 rounded-16 max-w-5xl mx-auto space-y-24"
    >
      <Typography variant="h6">{t("MERCHANT_PERSONAL_INFO")}</Typography>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-20">
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
      </div>
      <div className="pt-24 border-t border-divider">
        <Typography className="text-18 font-semibold mb-20">
          {t("ADDRESS")}
        </Typography>
        <AddressSection disabled={disabled} />
      </div>
    </Paper>
  );
}
