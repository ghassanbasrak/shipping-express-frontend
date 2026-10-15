import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import { AuthForm, AuthField, validation } from "../shared-components/AuthForm";
export default function ForgotPasswordPage() {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  const navigate = useNavigate();
  return (
    <AuthLayout title={t("RESET_PASSWORD")}>
      <AuthForm
        schema={z.object({ email: validation(t).email })}
        defaults={{ email: "" }}
        submit={t("SUBMIT")}
        onSubmit={async ({ email }) => {
          await auth.requestResetCode(email);
          navigate("/reset-code-sent");
        }}
      >
        <AuthField name="email" type="email" label={t("EMAIL")} />
      </AuthForm>
      <Link className="block mt-24" to="/sign-in">
        {t("SIGN_IN")}
      </Link>
    </AuthLayout>
  );
}
