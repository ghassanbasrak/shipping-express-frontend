import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { CustomPhoneNumberProps } from "./Utils";
import PhoneInput from "mui-phone-input";

function CustomPhoneNumber({
  label,
  name = "phone",
  size,
  disabled,
  required = true,
  className = "mt-8 mb-16 w-full",
  hideCountryCodeSelector = false,
}: CustomPhoneNumberProps) {
  const { t, i18n } = useTranslation("public");
  const methods = useFormContext();
  const { control, getFieldState } = methods;
  const error = getFieldState(name).invalid;
  const helperText = getFieldState(name)?.error?.message;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <PhoneInput
          {...field}
          value={field.value || "+1"}
          className={className}
          lang={i18n.language}
          onChange={(e) => {
            field.onChange(
              `${e.countryCode ? `+${e.countryCode}` : ""}${e.areaCode ? `${e.areaCode}` : ""}${e.phoneNumber ? `${e.phoneNumber}` : ""}`
            );
          }}
          disableParentheses
          enableSearch
          label={label ?? t("PHONE_NUMBER")}
          variant="outlined"
          fullWidth
          error={error}
          helperText={helperText}
          searchVariant="standard"
          classes={{
            root: "w-full",
          }}
        />
      )}
    />
  );
}

export default CustomPhoneNumber;
