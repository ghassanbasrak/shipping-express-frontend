import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Alert } from "@mui/material";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import { AuthForm, AuthField, validation } from "../shared-components/AuthForm";
export default function ResetPasswordPage() {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  const [params] = useSearchParams();
  const v = validation(t);
  const email = params.get("email");
  const resetCode = params.get("resetCode") || params.get("token");
  const schema = z
    .object({ password: v.password, passwordConfirmation: z.string() })
    .refine((values) => values.password === values.passwordConfirmation, {
      path: ["passwordConfirmation"],
      message: t("PASSWORD_MATCH"),
    });
  return (
    <AuthLayout title={t("RESET_PASSWORD")}>
      {!email || !resetCode ? (
        <>
          <Alert severity="error">{t("RESET_INVALID")}</Alert>
          <Link to="/forgot-password">{t("RESET_PASSWORD")}</Link>
        </>
      ) : (
        <AuthForm
          schema={schema}
          defaults={{ password: "", passwordConfirmation: "" }}
          submit={t("SAVE")}
          onSubmit={async ({ password }) => {
            await auth.verifyResetCode(email, password, resetCode);
            await auth.signInWithEmailAndPassword(email, password);
          }}
        >
          <AuthField name="password" label={t("PASSWORD")} type="password" />
          <AuthField
            name="passwordConfirmation"
            label={t("PASSWORD_CONFIRM")}
            type="password"
          />
        </AuthForm>
      )}
    </AuthLayout>
  );
}
