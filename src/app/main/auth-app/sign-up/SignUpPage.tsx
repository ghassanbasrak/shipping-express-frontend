import { useState } from "react";
import { z } from "zod";
import { Button, Alert, Box, Typography } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import { ProfileCompletionError } from "src/app/auth/services/jwt/JwtAuthProvider";
import AuthLayout from "../AuthLayout";
import {
  AddressFields,
  AuthField,
  AuthForm,
  TermsField,
  digits,
  useOtpChallenge,
  validation,
} from "../shared-components/AuthForm";

export function profileSchema(
  t: (key: string) => string,
  registering = false,
  otpRequired = false,
) {
  const v = validation(t);
  return z
    .object({
      firstName: v.required,
      lastName: v.required,
      companyName: z.string(),
      email: v.email,
      phoneCountry: v.phoneCountry,
      phone: v.phone,
      taxNumber: z
        .string()
        .transform(digits)
        .refine((value) => !value || /^\d{15}$/.test(value), t("TAX_LENGTH")),
      address: z.object({
        countryId: v.required,
        stateId: v.required,
        cityId: v.required,
        street: z.string(),
        zipCode: z.string(),
      }),
      acceptTermsConditions: z.boolean().refine(Boolean, t("TERMS")),
      password: registering ? z.string().optional() : v.password,
      passwordConfirmation: z.string().optional(),
      code: otpRequired ? v.code : z.string(),
      affiliateCode: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (!registering && data.password !== data.passwordConfirmation)
        ctx.addIssue({
          code: "custom",
          path: ["passwordConfirmation"],
          message: t("PASSWORD_MATCH"),
        });
      if (data.taxNumber && !data.address.street.trim())
        ctx.addIssue({
          code: "custom",
          path: ["address", "street"],
          message: t("REQUIRED"),
        });
    });
}
export function profilePayload(values: Record<string, any>) {
  const {
    phoneCountry,
    phone,
    passwordConfirmation,
    acceptTermsConditions,
    code,
    affiliateCode,
    ...rest
  } = values;
  const address = Object.fromEntries(
    Object.entries(rest.address).filter(([, value]) => value !== ""),
  );
  return {
    ...Object.fromEntries(
      Object.entries(rest).filter(
        ([key, value]) => key !== "address" && value !== "",
      ),
    ),
    address,
    phone: `${phoneCountry}-${phone}`,
  };
}
export function ProfileFields({
  locked,
  password,
  verifiedPhone = false,
  verifiedEmail = false,
}: {
  locked: boolean;
  password: boolean;
  verifiedPhone?: boolean;
  verifiedEmail?: boolean;
}) {
  const { t } = useTranslation("ashamcoAuth");
  const sectionSx = { display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2.5, minWidth: 0, "& > *": { minWidth: 0 } } as const;
  return (
    <>
      <Box component="section" aria-label={t("SECTION_IDENTITY")} sx={{ ...sectionSx, mt: 1 }}>
        <Typography component="h2" variant="subtitle1" sx={{ gridColumn: "1 / -1", fontWeight: 700 }}>
          {t("SECTION_IDENTITY")}
        </Typography>
        <AuthField name="firstName" label={t("FIRST_NAME")} autoComplete="given-name" />
        <AuthField name="lastName" label={t("LAST_NAME")} autoComplete="family-name" />
        <AuthField name="companyName" label={t("COMPANY_NAME")} autoComplete="organization" />
        <AuthField name="taxNumber" label={t("TAX_NUMBER")} />
      </Box>
      <Box component="section" aria-label={t("SECTION_CONTACT")} sx={sectionSx}>
        <Typography component="h2" variant="subtitle1" sx={{ gridColumn: "1 / -1", fontWeight: 700 }}>
          {t("SECTION_CONTACT")}
        </Typography>
        <AuthField name="email" label={t("EMAIL")} type="email" autoComplete="email" disabled={locked || verifiedEmail} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(130px, .7fr) minmax(0, 1.3fr)" }, gap: 2, minWidth: 0 }}>
          <AuthField name="phoneCountry" label={t("CALLING_CODE_SHORT")} type="tel" autoComplete="tel-country-code" disabled={locked || verifiedPhone} />
          <AuthField name="phone" label={t("PHONE")} type="tel" autoComplete="tel-national" disabled={locked || verifiedPhone} />
        </Box>
      </Box>
      <Box component="section" aria-label={t("SECTION_ADDRESS")} sx={sectionSx}>
        <Typography component="h2" variant="subtitle1" sx={{ gridColumn: "1 / -1", fontWeight: 700 }}>
          {t("SECTION_ADDRESS")}
        </Typography>
        <AddressFields />
      </Box>
      {password && (
        <Box component="section" aria-label={t("SECTION_SECURITY")} sx={sectionSx}>
          <Typography component="h2" variant="subtitle1" sx={{ gridColumn: "1 / -1", fontWeight: 700 }}>
            {t("SECTION_SECURITY")}
          </Typography>
          <AuthField name="password" label={t("PASSWORD")} type="password" autoComplete="new-password" />
          <AuthField name="passwordConfirmation" label={t("PASSWORD_CONFIRM")} type="password" autoComplete="new-password" />
          <Typography color="text.secondary" variant="caption" sx={{ gridColumn: "1 / -1", mt: -1 }}>
            {t("PASSWORD_MIN")}
          </Typography>
        </Box>
      )}
      <TermsField />
    </>
  );
}
export function ResendProfileCode({
  challenge,
  type,
}: {
  challenge: ReturnType<typeof useOtpChallenge>;
  type: "signUp" | "link";
}) {
  const { getValues, setValue } = useFormContext();
  const auth = useJwtAuth();
  const { t } = useTranslation("ashamcoAuth");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <>
      {error && <Alert severity="error">{t("ERROR")}</Alert>}
      <AuthField name="code" label={t("CODE")} />
      <Button
        color="primary"
        variant="outlined"
        disabled={loading || challenge.seconds > 0}
        onClick={async () => {
          setLoading(true);
          setError(false);
          try {
            const v = getValues();
            challenge.start(
              await auth.sendOtpCode(
                `${digits(v.phoneCountry)}-${digits(v.phone)}`,
                type,
                v.email,
              ),
            );
            setValue("code", "");
          } catch {
            setError(true);
          } finally {
            setLoading(false);
          }
        }}
      >
        {t("RESEND")} {challenge.seconds > 0 && `(${challenge.seconds})`}
      </Button>
      <Button
        color="primary"
        variant="outlined"
        onClick={() => {
          challenge.clear();
          setValue("code", "");
        }}
      >
        {t("CHANGE_CONTACT")}
      </Button>
    </>
  );
}
export default function SignUpPage() {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  const challenge = useOtpChallenge();
  const [phoneVerified, setPhoneVerified] = useState(false);
  return (
    <AuthLayout title={t("SIGN_UP")} description={t("SIGN_UP_SUBTITLE")} onboardingStep={0} product wide>
      <AuthForm
        schema={profileSchema(t, false, challenge.sent && !phoneVerified)}
        defaults={{
          firstName: "",
          lastName: "",
          companyName: "",
          email: "",
          phoneCountry: "+966",
          phone: "",
          taxNumber: "",
          address: {
            countryId: import.meta.env.VITE_DEFAULT_COUNTRY_ID || "",
            stateId: "",
            cityId: "",
            street: "",
            zipCode: "",
          },
          password: "",
          passwordConfirmation: "",
          acceptTermsConditions: false,
          code: "",
          affiliateCode: localStorage.getItem("affiliateCode") || "",
        }}
        submit={t(phoneVerified ? "SAVE" : challenge.sent ? "VERIFY" : "SEND_CODE")}
        onSubmit={async (values) => {
          const phone = `${values.phoneCountry}-${values.phone}`;
          const profile = { ...profilePayload(values), affiliateCode: values.affiliateCode };
          if (phoneVerified) {
            await auth.completeSignUpProfile(profile);
            return;
          }
          if (!challenge.sent) {
            challenge.start(
              await auth.sendOtpCode(phone, "signUp", values.email),
            );
            return;
          }
          validation(t).code.parse(values.code);
          try {
            await auth.signUpWithPhoneNumber(phone, values.code, challenge.messageId, profile);
          } catch (error) {
            if (error instanceof ProfileCompletionError) setPhoneVerified(true);
            throw error;
          }
        }}
      >
        <ProfileFields locked={challenge.sent} password />
        <AuthField name="affiliateCode" label={t("AFFILIATE_CODE")} />
        {challenge.sent && !phoneVerified && (
          <ResendProfileCode challenge={challenge} type="signUp" />
        )}
      </AuthForm>
      <Typography color="text.secondary" variant="body2" sx={{ mt: 3, textAlign: "center" }}>
        {t("HAVE_ACCOUNT")} <Link to="/sign-in">{t("SIGN_IN")}</Link>
      </Typography>
    </AuthLayout>
  );
}
