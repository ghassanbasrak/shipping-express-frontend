import { useEffect, useState } from "react";
import { Button, Alert, Box, Typography } from "@mui/material";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import {
  AuthField,
  AuthForm,
  useOtpChallenge,
  validation,
} from "../shared-components/AuthForm";
export default function OtpCodeSentPage() {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  const { phone = "" } = useParams();
  const [params] = useSearchParams();
  const challenge = useOtpChallenge();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const messageId = params.get("messagatId");
  useEffect(() => {
    if (messageId) challenge.start(messageId);
  }, [messageId, phone]);
  const fullPhone = phone.startsWith("+") ? phone : `+${phone}`;
  return (
    <AuthLayout
      title={t("PHONE_CODE_TITLE")}
      description={t("PHONE_CODE_SUBTITLE")}
      product
    >
      <Box
        className="mb-20 rounded-12 border p-16"
        sx={{ borderColor: "divider", bgcolor: "action.hover" }}
      >
        <Typography variant="caption" color="text.secondary">
          {t("PHONE")}
        </Typography>
        <Typography dir="ltr" className="mt-4 font-semibold break-all">
          {fullPhone}
        </Typography>
      </Box>
      {error && (
        <Alert severity="error" className="mb-20">
          {error}
        </Alert>
      )}
      <AuthForm
        key={phone}
        schema={z.object({ code: validation(t).code })}
        defaults={{ code: "" }}
        submit={t("VERIFY")}
        disabled={!challenge.sent}
        onSubmit={({ code }) =>
          auth.signInWithPhoneNumber(fullPhone, code, challenge.messageId)
        }
      >
        <AuthField name="code" label={t("CODE")} autoComplete="one-time-code" />
      </AuthForm>
      <div className="flex flex-col items-center gap-20 mt-24 text-center">
        <Button
          color="primary"
          variant="outlined"
          fullWidth
          className="min-h-52 rounded-8"
          disabled={challenge.seconds > 0 || sending}
          onClick={async () => {
            setSending(true);
            setError("");
            try {
              challenge.start(await auth.sendOtpCode(fullPhone));
            } catch {
              setError(t("ERROR"));
            } finally {
              setSending(false);
            }
          }}
        >
          {t("RESEND")} {challenge.seconds > 0 && `(${challenge.seconds})`}
        </Button>
        <Link to="/sign-in-phone">{t("CHANGE_CONTACT")}</Link>
      </div>
    </AuthLayout>
  );
}
