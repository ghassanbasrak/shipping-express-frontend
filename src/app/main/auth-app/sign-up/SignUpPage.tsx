import { useState } from "react";
import { z } from "zod";
import { Button, Alert } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
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
  return (
    <>
      <AuthField name="firstName" label={t("FIRST_NAME")} />
      <AuthField name="lastName" label={t("LAST_NAME")} />
      <AuthField name="companyName" label={t("COMPANY_NAME")} />
      <AuthField
        name="email"
        label={t("EMAIL")}
        type="email"
        disabled={locked || verifiedEmail}
      />
      <AuthField
        name="phoneCountry"
        label={t("PHONE_COUNTRY")}
        type="tel"
        disabled={locked || verifiedPhone}
      />
      <AuthField
        name="phone"
        label={t("PHONE")}
        type="tel"
        disabled={locked || verifiedPhone}
      />
      <AuthField name="taxNumber" label={t("TAX_NUMBER")} />
      <AddressFields />
      {password && (
        <>
          <AuthField name="password" label={t("PASSWORD")} type="password" />
          <AuthField
            name="passwordConfirmation"
            label={t("PASSWORD_CONFIRM")}
            type="password"
          />
        </>
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
  return (
    <AuthLayout title={t("SIGN_UP")}>
      <AuthForm
        schema={profileSchema(t, false, challenge.sent)}
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
        submit={t(challenge.sent ? "VERIFY" : "SEND_CODE")}
        onSubmit={async (values) => {
          const phone = `${values.phoneCountry}-${values.phone}`;
          if (!challenge.sent) {
            challenge.start(
              await auth.sendOtpCode(phone, "signUp", values.email),
            );
            return;
          }
          validation(t).code.parse(values.code);
          await auth.signUpWithPhoneNumber(
            phone,
            values.code,
            challenge.messageId,
            { ...profilePayload(values), affiliateCode: values.affiliateCode },
          );
        }}
      >
        <ProfileFields locked={challenge.sent} password />
        <AuthField name="affiliateCode" label={t("AFFILIATE_CODE")} />
        {challenge.sent && (
          <ResendProfileCode challenge={challenge} type="signUp" />
        )}
      </AuthForm>
      <Link className="block mt-24" to="/sign-in">
        {t("SIGN_IN")}
      </Link>
    </AuthLayout>
  );
}
