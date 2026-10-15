import { Button, ButtonGroup, TextField, Typography } from "@mui/material";
import clsx from "clsx";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";

function CustomCounterInput({
  name,
  label,
  max,
  size = "medium",
  disabled = false,
  className = "mt-8 mb-16",
}: {
  name: string;
  label?: string;
  max?: number;
  size?: "medium" | "large";
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useTranslation("public");
  const methods = useFormContext();
  const { control, getFieldState } = methods;
  const error = getFieldState(name).invalid;
  const helperText = getFieldState(name)?.error?.message;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div
          className={clsx("flex flex-col items-start", className)}
          {...field}
        >
          {label && <Typography className="mb-8">{label}</Typography>}
          <ButtonGroup
            className={clsx(size === "large" ? "h-56" : "h-40")}
            size={size}
            aria-label="Basic button group"
          >
            <Button
              className="text-15 font-bold border-2"
              size={size}
              variant="outlined"
              color="primary"
              sx={{
                borderWidth: "2px!important",
                borderLeftColor: "initial!important",
                borderRightColor: "initial!important",
                "&:hover": {
                  borderWidth: "2px!important",
                },
              }}
              disabled={field.value <= 1 || disabled}
              onClick={() => field.onChange(Math.max(1, field.value - 1))}
            >
              <Icon type="fa6" name="FaMinus" size="1.4rem" />
            </Button>
            <Button
              className={clsx(
                "text-16 font-bold border-2",
                size === "large" ? "w-64" : "w-56",
              )}
              size={size}
              variant="outlined"
              color="primary"
              sx={{
                color: (theme) => `${theme.palette.text.primary}!important`,
                borderWidth: "2px!important",
                borderRight: "none!important",
                borderLeft: "none!important",
                borderColor: (theme) => theme.palette.action.disabled,
                "&:hover": {
                  borderWidth: "2px!important",
                  borderColor: (theme) => theme.palette.action.disabled,
                },
                position: "relative",
                overflow: "visible!important",
              }}
              disabled={disabled}
              disableRipple
            >
              <TextField
                dir="ltr"
                value={field.value}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 1;
                  if (newValue >= 1) {
                    field.onChange(newValue);
                  }
                }}
                inputProps={{
                  min: 1,
                  max: max !== undefined ? max : undefined,
                  style: {
                    textAlign: "center",
                    padding: "0",
                    height: "100%",
                    fontSize: size === "medium" ? "16px" : "18px",
                    fontWeight: "bold",
                    cursor: "text",
                  },
                }}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  "& .MuiOutlinedInput-root": {
                    height: "100%",
                    "& fieldset": {
                      border: "none!important", // Remove all borders
                    },
                    "&:hover fieldset": {
                      border: "none!important", // Remove border on hover
                    },
                    "&.Mui-focused fieldset": {
                      border: "none!important", // Remove border on focus
                      boxShadow: "none!important", // Remove focus shadow
                    },
                    "& .MuiInputBase-input": {
                      padding: "0!important",
                      textAlign: "center",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  },
                }}
                variant="outlined"
                disabled={disabled}
              />

              <span style={{ opacity: 0, pointerEvents: "none" }}>
                {field.value}
              </span>
            </Button>
            <Button
              className="text-15 font-bold border-2"
              size={size}
              variant="outlined"
              color="primary"
              sx={{
                borderWidth: "2px!important",
                borderLeftColor: "initial!important",
                borderRightColor: "initial!important",
                "&:hover": {
                  borderWidth: "2px!important",
                },
              }}
              onClick={() => field.onChange(field.value + 1)}
              disabled={
                (max !== undefined ? field.value >= max : false) || disabled
              }
            >
              <Icon type="fa6" name="FaPlus" size="1.4rem" />
            </Button>
          </ButtonGroup>
          {error && (
            <Typography className="text-11 font-semibold mt-8" color="error">
              {helperText}
            </Typography>
          )}
        </div>
      )}
    />
  );
}
export default CustomCounterInput;
