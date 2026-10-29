import { Controller, useFormContext } from "react-hook-form";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

export default function ShipmentField({
  name,
  label,
  type = "text",
  required = false,
  disabled = false,
  multiline = false,
  unit,
  icon,
  helper,
  className,
  children,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  unit?: string;
  icon?: string;
  helper?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) =>
        type === "checkbox" ? (
          <div className={className}>
            <Box
              sx={(theme) => ({
                border: `1px solid ${fieldState.error ? theme.palette.error.main : field.value ? theme.palette.primary.main : theme.palette.divider}`,
                borderRadius: "12px",
                px: 1.5,
                py: 0.25,
                backgroundColor: field.value
                  ? alpha(theme.palette.primary.main, 0.06)
                  : "transparent",
                transition: "all .2s ease",
              })}
            >
              <FormControlLabel
                label={label}
                sx={{ m: 0, width: "100%", alignItems: "center" }}
                control={
                  <Checkbox
                    name={name}
                    checked={!!field.value}
                    disabled={disabled}
                    onChange={(_, checked) => field.onChange(checked)}
                  />
                }
              />
            </Box>
            {(fieldState.error?.message || helper) && (
              <FormHelperText error={!!fieldState.error} sx={{ mx: 1.75 }}>
                {fieldState.error?.message || helper}
              </FormHelperText>
            )}
          </div>
        ) : (
          <TextField
            {...field}
            className={className}
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
            InputProps={{
              startAdornment: icon ? (
                <InputAdornment position="start">
                  <FuseSvgIcon size={20} color="action">
                    {icon}
                  </FuseSvgIcon>
                </InputAdornment>
              ) : undefined,
              endAdornment: unit ? (
                <InputAdornment position="end">{unit}</InputAdornment>
              ) : undefined,
            }}
            error={!!fieldState.error}
            helperText={fieldState.error?.message || helper}
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
