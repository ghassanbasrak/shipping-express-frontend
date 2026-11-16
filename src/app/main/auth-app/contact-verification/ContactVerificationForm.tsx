import { useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import CustomPhoneNumber from "app/shared-components/custom-phone-number/CustomPhoneNumber";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import type { ContactKind } from "src/app/auth/services/jwt/contactVerification";
import {
  AuthField,
  digits,
  useOtpChallenge,
  validation,
} from "../shared-components/AuthForm";

export default function ContactVerificationForm({
  kind,
  onVerified,
}: {
  kind: ContactKind;
  onVerified: () => void;
}) {
  const { t } = useTranslation("ashamcoAuth"),
    auth = useJwtAuth();
  const challenge = useOtpChallenge(),
    lock = useRef(false);
  const [contact, setContact] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const phone = kind === "phone";
  const methods = useForm({
    defaultValues: {
      contact: auth.user?.[kind] || (phone ? "+966-" : ""),
      code: "",
    },
    mode: "onChange",
    resolver: zodResolver(
      z.object({
        contact: phone
          ? z
              .string()
              .transform(digits)
              .pipe(
                z
                  .string()
                  .regex(/^\+[1-9]\d{0,3}-?[1-9]\d{4,14}$/, t("INVALID_PHONE")),
              )
          : validation(t).email,
        code: challenge.sent
          ? z
              .string()
              .trim()
              .transform(digits)
              .pipe(
                z
                  .string()
                  .regex(phone ? /^\d{4,6}$/ : /^\d{6}$/, t("INVALID_CODE")),
              )
          : z.string(),
      }),
    ),
  });
  async function send(value: string) {
    const id = phone
      ? await auth.sendPhoneVerificationCode(value)
      : (await auth.sendEmailVerificationCode(value), "email");
    setContact(value);
    challenge.start(id);
    methods.setValue("code", "");
  }
  async function run(
    action: () => Promise<void>,
    errorKey = challenge.sent ? "CONTACT_VERIFY_ERROR" : "CONTACT_SEND_ERROR",
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch {
      setError(t(errorKey));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <FormProvider {...methods}>
      <form
        noValidate
        className="space-y-16"
        onSubmit={methods.handleSubmit((values) =>
          run(async () => {
            if (!challenge.sent) await send(values.contact);
            else {
              if (phone)
                await auth.linkWithPhoneNumber(
                  contact,
                  values.code,
                  challenge.messageId,
                );
              else await auth.linkWithEmail(contact, values.code);
              onVerified();
            }
          }),
        )}
      >
        {error && <Alert severity="error">{error}</Alert>}
        {phone ? (
          <CustomPhoneNumber
            name="contact"
            serialized
            label={t("PHONE")}
            disabled={busy || challenge.sent}
            className="w-full"
          />
        ) : (
          <AuthField
            name="contact"
            type="email"
            label={t("EMAIL")}
            disabled={busy || challenge.sent}
            autoComplete="email"
          />
        )}
        {challenge.sent && (
          <>
            <Alert severity="info">
              {t("CONTACT_CODE_SENT")} <span dir="ltr">{contact}</span>
            </Alert>
            <AuthField
              id={`verify-${kind}-code`}
              name="code"
              label={t("CODE")}
              disabled={busy}
              autoComplete="one-time-code"
            />
          </>
        )}
        <LoadingButton
          type="submit"
          variant="contained"
          color="secondary"
          fullWidth
          loading={busy}
          disabled={busy}
        >
          {t(challenge.sent ? "VERIFY" : "SEND_CODE")}
        </LoadingButton>
        {challenge.sent && (
          <div className="flex flex-wrap gap-8">
            <Button
              type="button"
              variant="outlined"
              disabled={busy || challenge.seconds > 0}
              onClick={() =>
                void run(() => send(contact), "CONTACT_SEND_ERROR")
              }
            >
              {t("RESEND")} {challenge.seconds > 0 && `(${challenge.seconds})`}
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                challenge.clear();
                methods.setValue("code", "");
                setError("");
              }}
            >
              {t("CHANGE_CONTACT")}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
