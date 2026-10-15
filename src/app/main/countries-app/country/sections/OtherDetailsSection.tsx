import { Controller, useFormContext } from "react-hook-form";
import { TextField, Typography, Box, alpha } from "@mui/material";
import { useTranslation } from "react-i18next";
import ICountry from "../../models/ICountry";
export default function OtherDetailsSection() {
  const { t } = useTranslation("countriesApp");
  const { control } = useFormContext<ICountry>();
  return (
    <section>
      <Box
        component="div"
        className="py-8 px-16 my-16 w-full rounded-lg"
        sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}
      >
        <Typography className="text-17 font-bold">
          {t("OTHER_COUNTRY_DETAILS")}
        </Typography>
      </Box>
      {(["code", "dialCode"] as const).map((name) => (
        <Controller
          key={name}
          name={name}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t(name === "code" ? "CODE" : "DIAL_CODE")}
              required
              fullWidth
              className="mb-16"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              inputProps={{ dir: "ltr" }}
            />
          )}
        />
      ))}
    </section>
  );
}
