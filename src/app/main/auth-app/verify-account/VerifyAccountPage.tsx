import { useState } from "react";
import { Link } from "react-router-dom";
import { requiresVerification } from "src/app/auth/permissions";
import { z } from "zod";
import { Alert, Button } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
import {
  AuthForm,
  AuthField,
  digits,
  validation,
} from "../shared-components/AuthForm";
import { useSubmitVerificationMutation } from "../AuthApi";
import {
  createMedia,
  uploadMedia,
} from "app/shared-components/media-input/store/mediaSlice";
import { useAppDispatch } from "app/store/hooks";
import { isDemoMode } from "src/app/demo/demoMode";

export default function VerifyAccountPage() {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  const [submit] = useSubmitVerificationMutation();
  const [uploads, setUploads] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const user = auth.user;
  if (!user) return null;
  const schema = z
    .object({
      userType: z.enum(["company", "smallStore"]),
      name: validation(t).required,
      taxNumber: z.string().transform(digits),
      crNumber: z.string(),
      identityUrl: z.string(),
      freelanceDocumentUrl: z.string(),
      taxCertificateUrl: z.string(),
      crUrl: z.string(),
    })
    .superRefine((values, ctx) => {
      const requiredFile =
        values.userType === "company"
          ? "crUrl"
          : values.userType === "smallStore"
            ? "freelanceDocumentUrl"
            : null;
      if (
        requiredFile &&
        !z.string().url().safeParse(values[requiredFile]).success
      )
        ctx.addIssue({
          code: "custom",
          path: [requiredFile],
          message: t("REQUIRED"),
        });
      if (
        values.userType === "company" &&
        values.taxNumber &&
        !/^\d{15}$/.test(values.taxNumber)
      )
        ctx.addIssue({
          code: "custom",
          path: ["taxNumber"],
          message: t("TAX_LENGTH"),
        });
    });
  if (submitted || user.verificationStatus === "pending")
    return (
      <AuthLayout title={t("VERIFY_ACCOUNT")}>
        <Alert severity="info">{t("PENDING")}</Alert>
        <Button
          color="primary"
          variant="outlined"
          onClick={() => auth.getUser()}
        >
          {t("VERIFICATION_STATUS")}
        </Button>
        <Button color="primary" variant="outlined" onClick={auth.signOut}>
          {t("SIGN_OUT")}
        </Button>
      </AuthLayout>
    );
  return (
    <AuthLayout title={t("VERIFY_ACCOUNT")}>
      <AuthForm
        schema={schema}
        defaults={{
          userType: "company",
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          taxNumber: user.taxNumber || "",
          crNumber: "",
          identityUrl: "",
          freelanceDocumentUrl: "",
          taxCertificateUrl: "",
          crUrl: "",
        }}
        submit={t("SUBMIT")}
        disabled={uploads > 0}
        onSubmit={async (values) => {
          const payload = Object.fromEntries(
            Object.entries(values).filter(([, value]) => value !== ""),
          );
          await submit({
            ...payload,
            userId: user.id,
            status: "pending",
            type: "verification",
          }).unwrap();
          setSubmitted(true);
          await auth.getUser();
        }}
      >
        <AuthField
          name="userType"
          label={t("USER_TYPE")}
          options={[
            { value: "company", label: t("COMPANY") },
            { value: "smallStore", label: t("SMALL_STORE") },
          ]}
        />
        <AuthField name="name" label={t("NAME")} />
        <AuthField name="taxNumber" label={t("TAX_NUMBER")} />
        <AuthField name="crNumber" label={t("CR_NUMBER")} />
        {[
          ["identityUrl", "IDENTITY"],
          ["freelanceDocumentUrl", "FREELANCE"],
          ["taxCertificateUrl", "TAX_CERTIFICATE"],
          ["crUrl", "CR"],
        ].map(([name, label]) => (
          <UploadFileInput
            key={name}
            name={name}
            label={t(label)}
            userId={user.id}
            onBusy={(busy) => setUploads((count) => count + (busy ? 1 : -1))}
          />
        ))}
      </AuthForm>
      {!requiresVerification(user) && (
        <Button color="primary" variant="outlined" component={Link} to="/home">
          {t("HOME")}
        </Button>
      )}
      <Button color="primary" variant="outlined" onClick={auth.signOut}>
        {t("SIGN_OUT")}
      </Button>
    </AuthLayout>
  );
}
type PresignedMedia = { url: string; fields: Record<string, string> };
export function UploadFileInput({
  name,
  label,
  userId,
  onBusy,
  accept = "image/*,.pdf",
}: {
  name: string;
  label: string;
  userId: string;
  onBusy: (busy: boolean) => void;
  accept?: string;
}) {
  const { setValue, watch, getFieldState, formState } = useFormContext();
  const dispatch = useAppDispatch();
  const { t } = useTranslation("ashamcoAuth");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const url = watch(name);
  return (
    <div>
      <AuthField name={name} label={label} disabled />
      <Button
        color="primary"
        variant="outlined"
        component="label"
        disabled={progress !== null}
      >
        {t("UPLOAD")} {progress !== null && `${progress}%`}
        <input
          hidden
          type="file"
          accept={accept}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            onBusy(true);
            setProgress(0);
            setError(false);
            try {
              if (isDemoMode) {
                if (file.size > 1024 * 1024)
                  throw new Error("Demo files must be 1 MB or smaller");
                const demoUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(String(reader.result || ""));
                  reader.onerror = () => reject(reader.error);
                  reader.readAsDataURL(file);
                });
                setValue(name, demoUrl, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                return;
              }
              const media = (await dispatch(
                createMedia({ userId, fileName: file.name }),
              ).unwrap()) as PresignedMedia;
              await dispatch(
                uploadMedia({
                  ...media,
                  fields: media.fields as unknown as any[],
                  file,
                  onUploadProgress: (event) => {
                    if (event.total)
                      setProgress(
                        Math.round((event.loaded * 100) / event.total),
                      );
                  },
                }),
              ).unwrap();
              setValue(name, `${media.url}${media.fields.key}`, {
                shouldValidate: true,
                shouldDirty: true,
              });
            } catch {
              setError(true);
            } finally {
              setProgress(null);
              onBusy(false);
            }
          }}
        />
      </Button>
      {url && (
        <a href={url} target="_blank" rel="noreferrer">
          {label}
        </a>
      )}
      {error && <Alert severity="error">{t("ERROR")}</Alert>}
    </div>
  );
}
