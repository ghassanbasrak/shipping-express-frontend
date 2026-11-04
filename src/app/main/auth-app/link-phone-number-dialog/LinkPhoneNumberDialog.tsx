import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useFormContext } from "react-hook-form";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import {
  AuthForm,
  AuthField,
  useOtpChallenge,
  validation,
} from "../shared-components/AuthForm";
const emailMode = false;
export default function LinkPhoneNumberDialog({
  required = false,
  onClose,
}: {
  required?: boolean;
  onClose?: () => void;
}) {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  const challenge = useOtpChallenge();
  const v = validation(t);
  const [open, setOpen] = useState(true);
  const [sentEmail, setSentEmail] = useState(false);
  const sent = emailMode ? sentEmail : challenge.sent;
  const schema = emailMode
    ? z.object({
        email: v.email,
        code: sent
          ? z.string().regex(/^\d{6}$/, t("INVALID_CODE"))
          : z.string(),
      })
    : z.object({
        phoneCountry: v.phoneCountry,
        phone: v.phone,
        code: sent ? v.code : z.string(),
      });
  function close() {
    setOpen(false);
    onClose?.();
  }
  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      onClose={required ? undefined : close}
    >
      <DialogTitle>{t(emailMode ? "LINK_EMAIL" : "LINK_PHONE")}</DialogTitle>
      <DialogContent>
        <AuthForm
          schema={schema}
          defaults={{
            email: auth.user?.email || "",
            phoneCountry: "+966",
            phone: "",
            code: "",
          }}
          submit={t(sent ? "VERIFY" : "SEND_CODE")}
          onSubmit={async (values) => {
            if (emailMode) {
              if (!sent) {
                await auth.sendEmailVerificationCode(values.email);
                setSentEmail(true);
                challenge.start("email");
              } else {
                await auth.linkWithEmail(values.email, values.code);
                close();
              }
            } else {
              const phone = `${values.phoneCountry}-${values.phone}`;
              if (!sent) challenge.start(await auth.sendOtpCode(phone, "link"));
              else {
                await auth.linkWithPhoneNumber(
                  phone,
                  values.code,
                  challenge.messageId,
                );
                close();
              }
            }
          }}
        >
          {emailMode ? (
            <AuthField
              name="email"
              type="email"
              label={t("EMAIL")}
              disabled={sent}
            />
          ) : (
            <>
              <AuthField
                name="phoneCountry"
                type="tel"
                label={t("PHONE_COUNTRY")}
                disabled={sent}
              />
              <AuthField
                name="phone"
                type="tel"
                label={t("PHONE")}
                disabled={sent}
              />
            </>
          )}
          {sent && (
            <>
              <AuthField name="code" label={t("CODE")} />
              <Resend
                challenge={challenge}
                onChange={() => {
                  setSentEmail(false);
                  challenge.clear();
                }}
              />
            </>
          )}
        </AuthForm>
        <Button
          color="primary"
          variant="outlined"
          onClick={required ? auth.signOut : close}
        >
          {t(required ? "SIGN_OUT" : "CHANGE_CONTACT")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
function Resend({
  challenge,
  onChange,
}: {
  challenge: ReturnType<typeof useOtpChallenge>;
  onChange: () => void;
}) {
  const { getValues } = useFormContext();
  const auth = useJwtAuth();
  const { t } = useTranslation("ashamcoAuth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  return (
    <>
      {error && <Alert severity="error">{t("ERROR")}</Alert>}
      <Button
        color="primary"
        variant="outlined"
        disabled={loading || challenge.seconds > 0}
        onClick={async () => {
          setLoading(true);
          setError(false);
          try {
            const v = getValues();
            if (emailMode) {
              await auth.sendEmailVerificationCode(v.email);
              challenge.start("email");
            } else
              challenge.start(
                await auth.sendOtpCode(`${v.phoneCountry}-${v.phone}`, "link"),
              );
          } catch {
            setError(true);
          } finally {
            setLoading(false);
          }
        }}
      >
        {t("RESEND")} {challenge.seconds > 0 && `(${challenge.seconds})`}
      </Button>
      <Button color="primary" variant="outlined" onClick={onChange}>
        {t("CHANGE_CONTACT")}
      </Button>
    </>
  );
}
