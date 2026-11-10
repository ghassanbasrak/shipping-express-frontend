import { MenuItem, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Currency from "../../../../utils/currencyFormatter";
import { topupTotals } from "../../../../topup-requests-app/Utils";
import { banks, toBankTitle } from "../../../Utils";
export default function BankTransferDecisionForm({
  approval,
  amount,
}: {
  approval: boolean;
  amount: number;
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
      <div className="p-16 mt-16 rounded-12 border border-divider space-y-8">
        {[
          ["GROSS_TRANSFER_TOTAL", amount],
          ["TRANSFER_VAT", topupTotals(amount).taxTotal],
          ["WALLET_CREDIT", topupTotals(amount).amount],
        ].map(([key, value]) => (
          <div key={String(key)} className="flex justify-between gap-16">
            <span>{t(String(key))}</span>
            <strong>{Currency(Number(value))}</strong>
          </div>
        ))}
        <Typography className="text-12 mt-12" color="text.secondary">
          {t(approval ? "APPROVAL_CREDIT_HINT" : "REJECTION_CREDIT_HINT")}
        </Typography>
      </div>
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
