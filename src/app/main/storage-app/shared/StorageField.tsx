import CurrencyAdornment from "app/shared-components/currency-adornment/CurrencyAdornment";
import {
  Checkbox,
  FormControlLabel,
  FormHelperText,
  TextField,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import type { ReactNode } from "react";
export default function StorageField({
  name,
  label,
  type = "text",
  disabled = false,
  required = false,
  children,
  helper,
}: {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "checkbox" | "nullableNumber";
  disabled?: boolean;
  required?: boolean;
  children?: ReactNode;
  helper?: string;
}) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) =>
        type === "checkbox" ? (
          <div>
            <FormControlLabel
              label={label}
              control={
                <Checkbox
                  name={name}
                  checked={!!field.value}
                  onChange={(_, checked) => field.onChange(checked)}
                  disabled={disabled}
                />
              }
            />
            {fieldState.error && (
              <FormHelperText error>{fieldState.error.message}</FormHelperText>
            )}
          </div>
        ) : (
          <TextField
            {...field}
            value={field.value ?? ""}
            fullWidth
            required={required}
            disabled={disabled}
            label={label}
            InputProps={
              /(?:price|amount|balance|fee|cost|total)$/i.test(name)
                ? { endAdornment: <CurrencyAdornment /> }
                : undefined
            }
            select={!!children}
            multiline={type === "textarea"}
            rows={type === "textarea" ? 3 : undefined}
            type={
              type === "number" || type === "nullableNumber" ? "number" : "text"
            }
            error={!!fieldState.error}
            helperText={fieldState.error?.message || helper}
            onChange={(event) =>
              field.onChange(
                type === "number" || type === "nullableNumber"
                  ? event.target.value === ""
                    ? type === "nullableNumber"
                      ? null
                      : undefined
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
