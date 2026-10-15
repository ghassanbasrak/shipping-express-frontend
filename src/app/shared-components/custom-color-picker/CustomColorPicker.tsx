import { Controller, useFormContext } from "react-hook-form";
import { CustomColorPickerProps } from "./Utils";
import { useRef, useState } from "react";
import { Box, IconButton, Popover, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import ColorPicker from "react-best-gradient-color-picker";
import clsx from "clsx";
import Icon from "../Icon";

function CustomColorPicker({
  name,
  label,
  type = "full",
  value,
  onChange,
  size = "medium",
  withClearIcon = false,
  className = "mt-8 mb-16 w-full",
}: CustomColorPickerProps) {
  const { t } = useTranslation("public");
  const { control } = useFormContext();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const divRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => setAnchorEl(divRef.current);
  const handleClose = () => setAnchorEl(null);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange } }) => (
        <div className={clsx("relative", className)}>
          {label && <Typography className="mb-8">{label}</Typography>}
          <Box
            ref={divRef}
            className={clsx(
              "shadow",
              size === "small" ? "min-h-40" : "min-h-52"
            )}
            onClick={handleOpen}
            sx={{
              borderRadius: "4px",
              border: "1px solid rgba(0, 0, 0, 0.23)",
              cursor: "pointer",
              "&:hover": { borderColor: "rgba(0, 0, 0, 0.87)" },
              display: "flex",
              alignItems: "center",
              gap: 1,
              background:
                value ||
                (type === "color"
                  ? "transparent"
                  : "linear-gradient(90deg, #000000, #ffffff)"),
            }}
          ></Box>
          {withClearIcon && value && (
            <IconButton
              className="absolute left-0 top-36"
              color="error"
              onClick={() => onChange(undefined)}
            >
              {<Icon type="fa6" name="FaXmark" size="0.9em" />}
            </IconButton>
          )}
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <Box className="p-4" dir="ltr">
              <ColorPicker
                value={value}
                onChange={onChange}
                disableDarkMode
                // hideGradientControls={type === "color"}
                locales={{
                  CONTROLS: {
                    SOLID: t("SOLID"),
                    GRADIENT: t("GRADIENT"),
                  },
                }}
              />
            </Box>
          </Popover>
        </div>
      )}
    />
  );
}

export default CustomColorPicker;
