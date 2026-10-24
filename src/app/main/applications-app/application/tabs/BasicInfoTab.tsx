import { TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import LocaleInput from "app/shared-components/locale-input/LocaleInput";
import IApplication from "../../models/IApplication";
import ApplicationMerchantField from "../components/ApplicationMerchantField";
import ApplicationScopes from "../components/ApplicationScopes";
export default function BasicInfoTab({
  disabled = false,
}: {
  application?: IApplication;
  disabled?: boolean;
}) {
  const { t } = useTranslation("applicationsApp"),
    { control, watch } = useFormContext<IApplication>();
  const id = watch("id");
  return (
    <div className="space-y-16">
      <Typography className="text-18 font-semibold">
        {t("MAIN_INFORMATION")}
      </Typography>
      <LocaleInput
        name="name"
        label={t("NAME")}
        languages={["ar", "en"]}
        requiredLanguages={["en"]}
        disabled={disabled}
      />
      <Controller
        name="clientName"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            required
            disabled={disabled || Boolean(id)}
            label={t("CLIENT_NAME")}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <ApplicationMerchantField disabled={disabled} />
      <ApplicationScopes disabled={disabled} />
    </div>
  );
}
