import CustomPhoneNumber from "app/shared-components/custom-phone-number/CustomPhoneNumber";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import { AuthForm, validation } from "../shared-components/AuthForm";
export default function SignInPhonePage() {
  const { t } = useTranslation("ashamcoAuth");
  const v = validation(t);
  const auth = useJwtAuth();
  const navigate = useNavigate();
  return (
    <AuthLayout
      title={t("PHONE_SIGN_IN")}
      description={t("PHONE_SIGN_IN_SUBTITLE")}
      product
    >
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
        <Box
          sx={{
            minWidth: 0,
            "& .MuiOutlinedInput-root": {
              minHeight: 52,
              borderRadius: 2,
              bgcolor: "background.paper",
              "&.Mui-focused": {
                boxShadow: (theme) =>
                  `0 0 0 3px ${theme.palette.primary.main}22`,
              },
            },
            "& .MuiFormHelperText-root": { mx: 0.5 },
          }}
        >
          <CustomPhoneNumber
            name="phone"
            codeName="phoneCountry"
            label={t("PHONE")}
            className="w-full"
          />
        </Box>
      </AuthForm>
      <Box className="flex flex-col items-center gap-20 mt-32 text-center">
        <Link to="/sign-in">{t("EMAIL_SIGN_IN")}</Link>
        <Typography color="text.secondary" variant="body2">
          {t("NO_ACCOUNT")} <Link to="/sign-up">{t("SIGN_UP")}</Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
