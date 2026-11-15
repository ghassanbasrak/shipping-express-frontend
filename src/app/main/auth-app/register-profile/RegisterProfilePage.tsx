import { useTranslation } from "react-i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import {
  AuthForm,
} from "../shared-components/AuthForm";
import {
  ProfileFields,
  profilePayload,
  profileSchema,
} from "../sign-up/SignUpPage";
export default function RegisterProfilePage() {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  const { user } = auth;
  if (!user) return null;
  const parts = (user.phone || "+966-").split("-");
  return (
    <AuthLayout title={t("REGISTER")} description={t("REGISTER_SUBTITLE")} onboardingStep={1} product wide>
      <AuthForm
        key={user.id}
        schema={profileSchema(t, true)}
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
        }}
        submit={t("SAVE")}
        onSubmit={async (values) => {
          await auth.completeSignUpProfile(profilePayload(values));
        }}
      >
        <ProfileFields locked={false} password={false} />
      </AuthForm>
    </AuthLayout>
  );
}
