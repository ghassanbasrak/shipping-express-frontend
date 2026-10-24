import { Controller, useFormContext } from "react-hook-form";
import PhoneInput from "mui-phone-input";
import { PackageRequestFormValues } from "../../models/PackageRequestSchema";
export default function PhoneField({
  name,
  codeName,
  label,
  disabled = false,
  required = false,
}: {
  name: "phone";
  codeName: "phoneCountry";
  label: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const { control } = useFormContext<PackageRequestFormValues>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Controller
          name={codeName}
          control={control}
          render={({ field: country }) => (
            <div dir="ltr">
              <PhoneInput
                name={name}
                value={`${country.value || ""}${field.value || ""}`}
                onBlur={field.onBlur}
                onChange={(value) => {
                  country.onChange(
                    value.countryCode ? `+${value.countryCode}` : "",
                  );
                  field.onChange(
                    `${value.areaCode || ""}${value.phoneNumber || ""}`,
                  );
                }}
                disableParentheses
                enableSearch
                label={label}
                variant="outlined"
                fullWidth
                disabled={disabled}
                required={required}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                searchVariant="standard"
              />
            </div>
          )}
        />
      )}
    />
  );
}
