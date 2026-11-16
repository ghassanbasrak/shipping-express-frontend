import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Alert, Button, Typography } from "@mui/material";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import { AuthForm, AuthField, validation } from "../shared-components/AuthForm";
export default function ResetPasswordPage() {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  const [resetComplete, setResetComplete] = useState(false);
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
    <AuthLayout
      title={t("RESET_PASSWORD")}
      description={t("RESET_PASSWORD_SUBTITLE")}
      product
    >
      {resetComplete ? (
        <div className="space-y-24">
          <Alert severity="success">{t("RESET_COMPLETE")}</Alert>
          <Button
            component={Link}
            to="/sign-in"
            variant="contained"
            color="primary"
            fullWidth
            className="min-h-52 rounded-8"
          >
            {t("BACK_TO_SIGN_IN")}
          </Button>
        </div>
      ) : !email || !resetCode ? (
        <div className="space-y-24">
          <Alert severity="error">{t("RESET_INVALID")}</Alert>
          <Button
            component={Link}
            to="/forgot-password"
            variant="outlined"
            color="primary"
            fullWidth
            className="min-h-52 rounded-8"
          >
            {t("SEND_RESET_LINK")}
          </Button>
        </div>
      ) : (
        <AuthForm
          schema={schema}
          defaults={{ password: "", passwordConfirmation: "" }}
          submit={t("SAVE")}
          onSubmit={async ({ password }) => {
            await auth.verifyResetCode(email, password, resetCode);
            setResetComplete(true);
            await auth.signInWithEmailAndPassword(email, password).catch(() => {
              // The password was changed; the user can sign in from this success state.
            });
          }}
        >
          <AuthField
            name="password"
            label={t("PASSWORD")}
            type="password"
            autoComplete="new-password"
          />
          <AuthField
            name="passwordConfirmation"
            label={t("PASSWORD_CONFIRM")}
            type="password"
            autoComplete="new-password"
          />
          <Typography color="text.secondary" variant="caption">
            {t("PASSWORD_MIN")}
          </Typography>
        </AuthForm>
      )}
      {!resetComplete && (
        <Typography
          color="text.secondary"
          variant="body2"
          className="mt-32 text-center"
        >
          <Link to="/sign-in">{t("BACK_TO_SIGN_IN")}</Link>
        </Typography>
      )}
    </AuthLayout>
  );
}
