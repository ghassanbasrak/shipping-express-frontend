import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import { AuthField, AuthForm, validation } from "../shared-components/AuthForm";
export default function SignInPhonePage() {
  const { t } = useTranslation("ashamcoAuth");
  const v = validation(t);
  const auth = useJwtAuth();
  const navigate = useNavigate();
  return (
    <AuthLayout title={t("PHONE_SIGN_IN")}>
      <AuthForm
        schema={z.object({ phoneCountry: v.phoneCountry, phone: v.phone })}
        defaults={{ phoneCountry: "+966", phone: "" }}
        submit={t("SEND_CODE")}
        onSubmit={async ({ phoneCountry, phone }) => {
          const fullPhone = `${phoneCountry}-${phone}`;
          const id = await auth.sendOtpCode(fullPhone);
          navigate(
            `/otp-code-sent/${encodeURIComponent(fullPhone.replace(/^\+/, ""))}?messagatId=${encodeURIComponent(id)}`,
          );
        }}
      >
        <AuthField name="phoneCountry" label={t("PHONE_COUNTRY")} type="tel" />
        <AuthField name="phone" label={t("PHONE")} type="tel" />
      </AuthForm>
      <Link className="block mt-24" to="/sign-in">
        {t("SIGN_IN")}
      </Link>
    </AuthLayout>
  );
}
