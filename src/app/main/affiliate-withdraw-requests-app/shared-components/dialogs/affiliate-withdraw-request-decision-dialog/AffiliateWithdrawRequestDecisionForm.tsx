import { Button, MenuItem, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { banks, toBankTitle } from "../../../../bank-transfers-app/Utils";
import { UploadFileInput } from "src/app/main/auth-app/verify-account/VerifyAccountPage";
export default function AffiliateWithdrawRequestDecisionForm({
  approval,
  description,
  disabled,
  onUploading,
}: {
  approval: boolean;
  description?: string;
  disabled: boolean;
  onUploading: (value: boolean) => void;
}) {
  const { t } = useTranslation("affiliateWithdrawRequestsApp"),
    user = useAppSelector(selectUser);
  const { control, watch, setValue } = useFormContext<{
    bank: string;
    transactionReference: string;
    transactionDescription: string;
    transactionImageUrl: string;
  }>();
  const image = watch("transactionImageUrl");
  return (
    <div className="mt-16">
      <Typography>
        {t(
          approval
            ? "CONVERT_TO_CONFIRMED_MESSAGE"
            : "CONVERT_TO_REFUSED_MESSAGE",
        )}
      </Typography>
      {approval && (
        <fieldset disabled={disabled} className="border-0 p-0 m-0 min-w-0">
          {description && (
            <>
              <Typography className="font-semibold mt-16">
                {t("NOTES")}
              </Typography>
              <Typography className="mt-4 whitespace-pre-wrap break-words">
                {description}
              </Typography>
            </>
          )}
          <Typography className="font-semibold mt-16">
            {t("TRANSACTION_DETAILS")}
          </Typography>
          <Controller
            name="bank"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                className="mt-16"
                label={t("BANK", { ns: "bankTransfersApp" })}
                fullWidth
                required
                select
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {Object.values(banks).map((bank) => (
                  <MenuItem key={bank} value={bank}>
                    {t(toBankTitle(bank), { ns: "bankTransfersApp" })}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="transactionReference"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                className="mt-16"
                label={t("TRANSACTION_REFERENCE")}
                fullWidth
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="transactionDescription"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                className="mt-16 mb-16"
                label={t("REQUEST_NOTES")}
                fullWidth
                multiline
                rows={3}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <UploadFileInput
            name="transactionImageUrl"
            label={t("UPLOAD_TRANSACTION_IMAGE")}
            userId={user.id}
            accept="image/*"
            onBusy={onUploading}
          />
          {image && (
            <>
              <img
                className="w-full max-h-256 object-contain mt-12"
                src={image}
                alt={t("TRANSACTION_IMAGE")}
              />
              <Button
                variant="outlined"
                color="error"
                disabled={disabled}
                onClick={() =>
                  setValue("transactionImageUrl", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                {t("REMOVE")}
              </Button>
            </>
          )}
        </fieldset>
      )}
    </div>
  );
}
