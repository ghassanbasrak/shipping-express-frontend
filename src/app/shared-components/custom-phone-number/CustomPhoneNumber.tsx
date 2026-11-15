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
  codeName,
  serialized = false,
}: CustomPhoneNumberProps) {
  const { t, i18n } = useTranslation("public");
  const methods = useFormContext();
  const { control, watch, setValue } = methods;
  const country = codeName ? watch(codeName) : undefined;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PhoneInput
          {...field}
          value={
            codeName
              ? `${country || "+966"}${field.value || ""}`
              : (field.value || "+966").replace("-", "")
          }
          className={className}
          lang={i18n.language}
          onChange={(e) => {
            const code = e.countryCode ? `+${e.countryCode}` : "";
            const national = `${e.areaCode || ""}${e.phoneNumber || ""}`;
            if (codeName)
              setValue(codeName, code, {
                shouldDirty: true,
                shouldValidate: true,
              });
            field.onChange(
              codeName
                ? national
                : `${code}${serialized && code ? "-" : ""}${national}`,
            );
          }}
          disableParentheses
          enableSearch
          label={label ?? t("PHONE_NUMBER")}
          variant="outlined"
          fullWidth
          size={size}
          disabled={disabled}
          required={required}
          disableDropdown={hideCountryCodeSelector}
          error={
            !!fieldState.error ||
            !!(codeName && methods.getFieldState(codeName).error)
          }
          helperText={
            fieldState.error?.message ||
            (codeName && methods.getFieldState(codeName).error?.message)
          }
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
