import { useTranslation } from "react-i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import {
  AuthForm,
  useOtpChallenge,
  validation,
} from "../shared-components/AuthForm";
import {
  ProfileFields,
  ResendProfileCode,
  profilePayload,
  profileSchema,
} from "../sign-up/SignUpPage";
export default function RegisterProfilePage() {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  const { user } = auth;
  const challenge = useOtpChallenge();
  if (!user) return null;
  const parts = (user.phone || "+966-").split("-");
  return (
    <AuthLayout title={t("REGISTER")}>
      <AuthForm
        key={user.id}
        schema={profileSchema(t, true, challenge.sent)}
        defaults={{
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          companyName: user.companyName || "",
          email: user.email || "",
          phoneCountry: parts[0],
          phone: parts.slice(1).join(""),
          taxNumber: user.taxNumber || "",
          address: {
            countryId: import.meta.env.VITE_DEFAULT_COUNTRY_ID || "",
            stateId: "",
            cityId: "",
            street: "",
            zipCode: "",
            ...user.address,
          },
          acceptTermsConditions: false,
          code: "",
        }}
        submit={t(
          user.phoneVerified ? "SAVE" : challenge.sent ? "VERIFY" : "SEND_CODE",
        )}
        onSubmit={async (values) => {
          const phone = `${values.phoneCountry}-${values.phone}`;
          const payload = profilePayload(values);
          if (user.phoneVerified) {
            await auth.updateMe(payload);
            return;
          }
          if (!challenge.sent) {
            challenge.start(
              await auth.sendOtpCode(phone, "link", values.email),
            );
            return;
          }
          validation(t).code.parse(values.code);
          await auth.signUpWithPhoneNumber(
            phone,
            values.code,
            challenge.messageId,
            payload,
          );
        }}
      >
        <ProfileFields
          locked={challenge.sent}
          password={false}
          verifiedPhone={user.phoneVerified}
          verifiedEmail={user.emailVerified}
        />
        {challenge.sent && (
          <ResendProfileCode challenge={challenge} type="link" />
        )}
      </AuthForm>
    </AuthLayout>
  );
}
