import { MenuItem, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import IShipmentUser from "../../models/IShipmentUser";
import { ShipmentUserFormValues } from "../../models/ShipmentUserSchema";
import { shipmentUserTypes, toShipmentUserTypeTitle } from "../../Utils";
import PhoneField from "../components/PhoneField";
import AddressSection from "../sections/AddressSection";
export default function BasicInfoTab({
  disabled = false,
}: {
  shipmentUser?: IShipmentUser;
  disabled?: boolean;
}) {
  const { t } = useTranslation("shipmentUsersApp"),
    { control } = useFormContext<ShipmentUserFormValues>();
  return (
    <div className="space-y-16 pb-24">
      <Controller
        name="type"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            required
            select
            disabled={disabled}
            label={t("TYPE")}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          >
            {Object.values(shipmentUserTypes).map((value) => (
              <MenuItem key={value} value={value}>
                {t(toShipmentUserTypeTitle(value))}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        name="fullName"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            required
            disabled={disabled}
            label={t("FULL_NAME")}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            value={field.value || ""}
            fullWidth
            disabled={disabled}
            label={t("EMAIL")}
            inputProps={{ dir: "ltr" }}
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
        disabled={disabled}
      />
      <PhoneField
        name="phone1"
        codeName="phoneCountry1"
        label={t("PHONE_NUMBER_1")}
        disabled={disabled}
      />
      <Controller
        name="address.nationalAddress"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            value={field.value || ""}
            fullWidth
            disabled={disabled}
            label={t("NATIONAL_ADDRESS")}
            placeholder={t("NATIONAL_ADDRESS_PLACEHOLDER")}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <AddressSection disabled={disabled} />
    </div>
  );
}
