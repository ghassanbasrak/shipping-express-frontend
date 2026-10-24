import { MenuItem, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import IAdmin from "../../models/IAdmin";
import { adminRoles, toAdminRoleTitle, toAdminRoleFeatures } from "../../Utils";
import AdminPermissionFeatures from "../components/AdminPermissionFeatures";

export default function BasicInfoTab({
  disabled = false,
}: {
  admin?: IAdmin;
  disabled?: boolean;
}) {
  const { t } = useTranslation("adminsApp");
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<IAdmin>();
  const values = watch();
  return (
    <div className="space-y-16">
      <Typography className="text-18 font-semibold">
        {t("MAIN_INFORMATION")}
      </Typography>
      <TextField
        fullWidth
        disabled
        label={t("NAME")}
        value={`${values.firstName || ""} ${values.lastName || ""}`}
      />
      <TextField
        fullWidth
        disabled
        label={t("EMAIL")}
        inputProps={{ dir: "ltr" }}
        value={values.email || ""}
      />
      <TextField
        fullWidth
        disabled
        label={t("PHONE_NUMBER")}
        inputProps={{ dir: "ltr" }}
        value={values.phone || ""}
      />
      <Controller
        name="role"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            select
            disabled={disabled}
            label={t("ROLE")}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(event) => {
              field.onChange(event);
              setValue("features", toAdminRoleFeatures(event.target.value), {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          >
            {Object.values(adminRoles).map((role) => (
              <MenuItem key={role} value={role}>
                {t(toAdminRoleTitle(role))} (
                {t(`${toAdminRoleTitle(role)}_MESSAGE`)})
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Typography className="text-18 font-semibold">
        {t("ADMIN_PERMISSIONS")}
      </Typography>
      {errors.features?.message && (
        <Typography color="error">{errors.features.message}</Typography>
      )}
      <AdminPermissionFeatures disabled={disabled} />
    </div>
  );
}
