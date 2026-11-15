import CustomPhoneNumber from "app/shared-components/custom-phone-number/CustomPhoneNumber";
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
  return (
    <CustomPhoneNumber
      name={name}
      codeName={codeName}
      label={label}
      disabled={disabled}
      required={required}
      className="w-full"
    />
  );
}
