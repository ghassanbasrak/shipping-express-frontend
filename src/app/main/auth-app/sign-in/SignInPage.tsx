import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { isAxiosError } from "axios";
import { Box, Typography } from "@mui/material";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import { AuthField, AuthForm, validation } from "../shared-components/AuthForm";
export default function SignInPage() {
  const { t } = useTranslation("ashamcoAuth");
  const [params] = useSearchParams();
  const auth = useJwtAuth();
  const v = validation(t);
  return (
    <AuthLayout title={t("SIGN_IN_WELCOME")} description={t("SIGN_IN_SUBTITLE")} product>
      <AuthForm
        schema={z.object({ email: v.email, password: v.password })}
        defaults={{ email: params.get("email") || "", password: "" }}
        onSubmit={({ email, password }) =>
          auth.signInWithEmailAndPassword(email, password)
        }
        errorMessage={(failure) =>
          isAxiosError(failure) && [400, 401].includes(failure.response?.status ?? 0)
            ? t("INVALID_CREDENTIALS")
            : t("ERROR")
        }
        submit={t("SIGN_IN")}
      >
        <AuthField name="email" label={t("EMAIL")} type="email" autoComplete="username" />
        <AuthField name="password" label={t("PASSWORD")} type="password" autoComplete="current-password" />
        <Box sx={{ textAlign: "end", mt: -1 }}>
          <Link to="/forgot-password">{t("FORGOT")}</Link>
        </Box>
      </AuthForm>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5, mt: 4, textAlign: "center" }}>
        <Link to="/sign-in-phone">{t("PHONE_SIGN_IN")}</Link>
        <Typography color="text.secondary" variant="body2">
          {t("NO_ACCOUNT")} <Link to="/sign-up">{t("SIGN_UP")}</Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
