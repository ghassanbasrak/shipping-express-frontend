import { useEffect, useState } from "react";
import { Button, Alert } from "@mui/material";
import { useParams, useSearchParams } from "react-router-dom";
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
    <AuthLayout title={t("VERIFY")}>
      <p dir="ltr">{fullPhone}</p>
      {error && <Alert severity="error">{error}</Alert>}
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
        <AuthField name="code" label={t("CODE")} />
      </AuthForm>
      <Button
        color="primary"
        variant="outlined"
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
    </AuthLayout>
  );
}
