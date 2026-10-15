import { Box, Typography } from "@mui/material";
import { ColorPicker } from "mui-color";
import { Controller, useFormContext } from "react-hook-form";

function CustomColorPicker({
  name,
  label,
  hideTextfield = false,
  className = "mt-8 mb-16 w-full",
}: {
  name: string;
  label?: string;
  hideTextfield?: boolean;
  className?: string;
}) {
  const methods = useFormContext();
  const { control, getFieldState } = methods;
  return (
    <Box
      component="div"
      className={className}
      sx={{
        "& .makeStyles-colorpickerButton-2": {
          minHeight: "24px",
          alignSelf: "center",
        },
        "& .makeStyles-root-1": {
          width: "100%",
        },
        "& .MuiFormControl-root": {
          width: "100%",
        },
      }}
    >
      {label && (
        <Typography className="text-13 font-medium">{label}</Typography>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <ColorPicker
            {...field}
            hideTextfield={hideTextfield}
            onChange={(e) => {
              field.onChange(`#${e.hex}`);
            }}
          />
        )}
      />
      {getFieldState(name).invalid ? (
        <Typography color="error" className="text-14 mt-4" textAlign="center">
          {getFieldState(name)?.error?.message}
        </Typography>
      ) : null}
    </Box>
  );
}

export default CustomColorPicker;
