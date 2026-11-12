import CustomPhoneNumber from "app/shared-components/custom-phone-number/CustomPhoneNumber";
import { z } from "zod";
import { Box, Typography } from "@mui/material";
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
  validation,
} from "../shared-components/AuthForm";

export function profileSchema(t: (key: string) => string, registering = false) {
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
}: {
  locked: boolean;
  password: boolean;
}) {
  const { t } = useTranslation("ashamcoAuth");
  const sectionSx = {
    display: "grid",
    gridTemplateColumns: {
      xs: "minmax(0, 1fr)",
      sm: "repeat(2, minmax(0, 1fr))",
    },
    gap: 2.5,
    minWidth: 0,
    "& > *": { minWidth: 0 },
  } as const;
  return (
    <>
      <Box
        component="section"
        aria-label={t("SECTION_IDENTITY")}
        sx={{ ...sectionSx, mt: 1 }}
      >
        <Typography
          component="h2"
          variant="subtitle1"
          sx={{ gridColumn: "1 / -1", fontWeight: 700 }}
        >
          {t("SECTION_IDENTITY")}
        </Typography>
        <AuthField
          name="firstName"
          label={t("FIRST_NAME")}
          autoComplete="given-name"
        />
        <AuthField
          name="lastName"
          label={t("LAST_NAME")}
          autoComplete="family-name"
        />
        <AuthField
          name="companyName"
          label={t("COMPANY_NAME")}
          autoComplete="organization"
        />
        <AuthField name="taxNumber" label={t("TAX_NUMBER")} />
      </Box>
      <Box component="section" aria-label={t("SECTION_CONTACT")} sx={sectionSx}>
        <Typography
          component="h2"
          variant="subtitle1"
          sx={{ gridColumn: "1 / -1", fontWeight: 700 }}
        >
          {t("SECTION_CONTACT")}
        </Typography>
        <AuthField
          name="email"
          label={t("EMAIL")}
          type="email"
          autoComplete="email"
          disabled={locked}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "minmax(130px, .7fr) minmax(0, 1.3fr)",
            },
            gap: 2,
            minWidth: 0,
          }}
        >
          <CustomPhoneNumber
            name="phone"
            codeName="phoneCountry"
            label={t("PHONE")}
            className="w-full"
            disabled={locked}
          />
        </Box>
      </Box>
      <Box component="section" aria-label={t("SECTION_ADDRESS")} sx={sectionSx}>
        <Typography
          component="h2"
          variant="subtitle1"
          sx={{ gridColumn: "1 / -1", fontWeight: 700 }}
        >
          {t("SECTION_ADDRESS")}
        </Typography>
        <AddressFields />
      </Box>
      {password && (
        <Box
          component="section"
          aria-label={t("SECTION_SECURITY")}
          sx={sectionSx}
        >
          <Typography
            component="h2"
            variant="subtitle1"
            sx={{ gridColumn: "1 / -1", fontWeight: 700 }}
          >
            {t("SECTION_SECURITY")}
          </Typography>
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
          <Typography
            color="text.secondary"
            variant="caption"
            sx={{ gridColumn: "1 / -1", mt: -1 }}
          >
            {t("PASSWORD_MIN")}
          </Typography>
        </Box>
      )}
      <TermsField />
    </>
  );
}
export default function SignUpPage() {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  return (
    <AuthLayout
      title={t("SIGN_UP")}
      description={t("SIGN_UP_SUBTITLE")}
      onboardingStep={0}
      product
      wide
    >
      <AuthForm
        schema={profileSchema(t)}
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
          affiliateCode: localStorage.getItem("affiliateCode") || "",
        }}
        submit={t("SIGN_UP")}
        onSubmit={async (values) => {
          await auth.signUpWithEmailAndPassword({
            ...profilePayload(values),
            affiliateCode: values.affiliateCode,
          });
        }}
      >
        <ProfileFields locked={false} password />
        <AuthField name="affiliateCode" label={t("AFFILIATE_CODE")} />
      </AuthForm>
      <Typography
        color="text.secondary"
        variant="body2"
        sx={{ mt: 3, textAlign: "center" }}
      >
        {t("HAVE_ACCOUNT")} <Link to="/sign-in">{t("SIGN_IN")}</Link>
      </Typography>
    </AuthLayout>
  );
}
