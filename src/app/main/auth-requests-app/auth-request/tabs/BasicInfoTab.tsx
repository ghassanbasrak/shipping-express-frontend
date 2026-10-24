import { Button, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { UploadFileInput } from "src/app/main/auth-app/verify-account/VerifyAccountPage";
import IAuthRequest from "../../models/IAuthRequest";
export default function BasicInfoTab({
  disabled = false,
  uploading = false,
  onUploading,
}: {
  disabled?: boolean;
  uploading?: boolean;
  onUploading: (busy: boolean) => void;
}) {
  const { t } = useTranslation("authRequestsApp"),
    { control, watch, setValue } = useFormContext<IAuthRequest>(),
    user = useAppSelector(selectUser);
  const fileUrl = watch("fileUrl");
  return (
    <div className="space-y-16">
      {disabled ? (
        fileUrl && (
          <Button
            component="a"
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            variant="contained"
          >
            {t("DOWNLOAD_DOCUMENT")}
          </Button>
        )
      ) : (
        <>
          <UploadFileInput
            name="fileUrl"
            label={t("UPLOAD_REQUEST_IMAGE")}
            userId={user.id}
            onBusy={onUploading}
            accept=""
          />
          {fileUrl && (
            <Button
              disabled={uploading}
              color="error"
              onClick={() =>
                setValue("fileUrl", "", {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              {t("REMOVE")}
            </Button>
          )}
        </>
      )}
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            required
            disabled={disabled}
            multiline
            rows={6}
            label={t("REQUEST_NOTES")}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />
    </div>
  );
}
