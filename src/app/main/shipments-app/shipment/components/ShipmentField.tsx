import { Controller, useFormContext } from "react-hook-form";
import { Checkbox, FormControlLabel, TextField } from "@mui/material";
export default function ShipmentField({
  name,
  label,
  type = "text",
  required = false,
  disabled = false,
  multiline = false,
  children,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  children?: React.ReactNode;
}) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) =>
        type === "checkbox" ? (
          <FormControlLabel
            label={label}
            control={
              <Checkbox
                name={name}
                checked={!!field.value}
                disabled={disabled}
                onChange={(_, checked) => field.onChange(checked)}
              />
            }
          />
        ) : (
          <TextField
            {...field}
            value={field.value ?? ""}
            fullWidth
            label={label}
            required={required}
            disabled={disabled}
            multiline={multiline}
            rows={multiline ? 3 : undefined}
            select={!!children}
            type={type === "number" ? "number" : "text"}
            inputProps={type === "number" ? { step: "any" } : undefined}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(event) =>
              field.onChange(
                type === "number"
                  ? event.target.value === ""
                    ? undefined
                    : Number(event.target.value)
                  : event.target.value,
              )
            }
          >
            {children}
          </TextField>
        )
      }
    />
  );
}
