import { ReactNode } from "react";
import { Box, Paper, Step, StepLabel, Stepper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import LanguageSwitcher from "app/theme-layouts/shared-components/LanguageSwitcher";

export default function AuthLayout({
  title,
  children,
  onboardingStep,
  description,
  product = false,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onboardingStep?: 0 | 1 | 2;
  description?: string;
  product?: boolean;
  wide?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation("ashamcoAuth");

  if (product)
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          px: { xs: 0, sm: 3, lg: 5 },
          py: { xs: 0, sm: 3, lg: 5 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: wide ? 1160 : 1040,
            minHeight: { xs: "100dvh", sm: 640 },
            display: "flex",
            overflow: "hidden",
            borderRadius: { xs: 0, sm: 4 },
            border: { xs: 0, sm: 1 },
            borderColor: "divider",
            boxShadow: { xs: "none", sm: "0 22px 70px rgba(32, 20, 68, .09)" },
          }}
        >
          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              flex: "0 0 36%",
              flexDirection: "column",
              justifyContent: wide ? "flex-start" : "space-between",
              p: 5,
              bgcolor: "primary.dark",
              color: "primary.contrastText",
            }}
          >
            <Typography variant="overline" sx={{ letterSpacing: ".18em", fontWeight: 700, opacity: .82 }}>
              {t("TITLE")}
            </Typography>
            <Box sx={{ mt: wide ? 10 : 0 }}>
              <Typography variant="h3" component="p" sx={{ fontWeight: 800, fontSize: wide ? 38 : 46, lineHeight: 1.2, mb: 2 }}>
                {t("AUTH_PANEL_TITLE")}
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, opacity: .86 }}>
                {t("AUTH_PANEL_BODY")}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: .7, mt: wide ? "auto" : 0 }}>
              {t("TITLE")}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              px: { xs: 2.5, sm: 5, md: 6 },
              py: { xs: 3, sm: 4.5 },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: { xs: 5, sm: 7 } }}>
              <Link to="/" aria-label={t("TITLE")}>
                <img
                  src={`/brand/logos/ashamco-ar-${theme.palette.mode === "dark" ? "on-purple" : "primary"}.svg`}
                  alt="Ashamco Express"
                  style={{ display: "block", width: 170, height: 50, maxWidth: "100%", objectFit: "contain" }}
                />
              </Link>
              <LanguageSwitcher />
            </Box>
            <Box sx={{ width: "100%", maxWidth: wide ? 720 : 430, mx: "auto", my: "auto", pb: { xs: 3, sm: 0 } }}>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.25, mb: 1 }}>
                {title}
              </Typography>
              {description && (
                <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 4 }}>
                  {description}
                </Typography>
              )}
              {onboardingStep !== undefined && (
                <Stepper activeStep={onboardingStep} alternativeLabel sx={{ mb: 4 }} aria-label={t("ONBOARDING_PROGRESS")}>
                  {["STEP_ACCOUNT", "STEP_PROFILE", "STEP_VERIFICATION"].map((key) => (
                    <Step key={key}><StepLabel>{t(key)}</StepLabel></Step>
                  ))}
                </Stepper>
              )}
              {children}
            </Box>
          </Box>
        </Paper>
      </Box>
    );

  return (
    <Box
      className="flex flex-1 min-h-full items-center justify-center p-16 sm:p-32"
      sx={{
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
      }}
    >
      <Paper className="w-full max-w-640 p-24 sm:p-40 rounded-16">
        <div className="flex justify-between items-center mb-24">
          <Link to="/">
            <img
              src={`/brand/logos/ashamco-ar-${theme.palette.mode === "dark" ? "on-purple" : "primary"}.svg`}
              alt="Ashamco Express"
              width={170}
              height={50}
              className="max-w-200 h-auto"
            />
          </Link>
          <LanguageSwitcher />
        </div>
        <Typography component="h1" variant="h5" className="mb-24 font-bold">
          {title}
        </Typography>
        {onboardingStep !== undefined && (
          <Stepper activeStep={onboardingStep} alternativeLabel className="mb-32" aria-label={t("ONBOARDING_PROGRESS")}>
            {["STEP_ACCOUNT", "STEP_PROFILE", "STEP_VERIFICATION"].map((key) => (
              <Step key={key}>
                <StepLabel>{t(key)}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
        {children}
      </Paper>
    </Box>
  );
}
