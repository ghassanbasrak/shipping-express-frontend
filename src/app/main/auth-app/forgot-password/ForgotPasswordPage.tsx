import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Typography } from "@mui/material";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import { AuthForm, AuthField, validation } from "../shared-components/AuthForm";
export default function ForgotPasswordPage() {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  const navigate = useNavigate();
  return (
    <AuthLayout
      title={t("FORGOT_PASSWORD_TITLE")}
      description={t("FORGOT_PASSWORD_SUBTITLE")}
      product
    >
      <AuthForm
        schema={z.object({ email: validation(t).email })}
        defaults={{ email: "" }}
        submit={t("SEND_RESET_LINK")}
        onSubmit={async ({ email }) => {
          await auth.requestResetCode(email);
          navigate("/reset-code-sent");
        }}
      >
        <AuthField
          name="email"
          type="email"
          label={t("EMAIL")}
          autoComplete="email"
        />
      </AuthForm>
      <Typography
        color="text.secondary"
        variant="body2"
        className="mt-32 text-center"
      >
        <Link to="/sign-in">{t("BACK_TO_SIGN_IN")}</Link>
      </Typography>
    </AuthLayout>
  );
}
