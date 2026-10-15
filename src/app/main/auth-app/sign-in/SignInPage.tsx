import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import { AuthField, AuthForm, validation } from "../shared-components/AuthForm";
export default function SignInPage() {
  const { t } = useTranslation("ashamcoAuth");
  const [params] = useSearchParams();
  const auth = useJwtAuth();
  const v = validation(t);
  return (
    <AuthLayout title={t("SIGN_IN")}>
      <AuthForm
        schema={z.object({ email: v.email, password: v.password })}
        defaults={{ email: params.get("email") || "", password: "" }}
        onSubmit={({ email, password }) =>
          auth.signInWithEmailAndPassword(email, password)
        }
        submit={t("SIGN_IN")}
      >
        <AuthField name="email" label={t("EMAIL")} type="email" />
        <AuthField name="password" label={t("PASSWORD")} type="password" />
        <Link to="/forgot-password">{t("FORGOT")}</Link>
      </AuthForm>
      <div className="flex justify-between mt-24">
        <Link to="/sign-in-phone">{t("PHONE_SIGN_IN")}</Link>
        <Link to="/sign-up">{t("SIGN_UP")}</Link>
      </div>
    </AuthLayout>
  );
}
