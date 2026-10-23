import { MenuItem, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { banks, toBankTitle } from "../../../Utils";
export default function BankTransferDecisionForm({
  approval,
}: {
  approval: boolean;
}) {
  const { t } = useTranslation("bankTransfersApp");
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext<{ bank?: string; notes?: string }>();
  return (
    <div className="mt-16">
      <Typography>
        {t(
          approval
            ? "CONVERT_TO_CONFIRMED_MESSAGE"
            : "CONVERT_TO_REFUSED_MESSAGE",
        )}
      </Typography>
      {approval ? (
        <Controller
          name="bank"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value || ""}
              className="mt-24 mb-16"
              error={!!errors.bank}
              required
              helperText={errors.bank?.message}
              label={t("BANK")}
              id="bank"
              fullWidth
              select
              disabled={isSubmitting}
              inputProps={{ "data-testid": "bank-transfer-bank" }}
            >
              {Object.values(banks).map((bank) => (
                <MenuItem key={bank} value={bank}>
                  {t(toBankTitle(bank))}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      ) : (
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value || ""}
              className="mt-24 mb-16"
              error={!!errors.notes}
              helperText={errors.notes?.message}
              label={t("REJECTION_NOTES")}
              id="notes"
              fullWidth
              autoFocus
              disabled={isSubmitting}
            />
          )}
        />
      )}
    </div>
  );
}
