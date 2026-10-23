import {
  Checkbox,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { User } from "src/app/auth/user";
import Currency, {
  getCurrentCurrency,
} from "src/app/main/utils/currencyFormatter";
import ITransaction from "../../models/ITransaction";
import {
  transactionTypes,
  toTransactionTypeTitle,
  toRelatedBalanceTypeTitle,
  depositTransactionTypes,
  withdrawTransactionTypes,
  toDepositTransactionTypeTitle,
  toWithdrawTransactionTypeTitle,
  transactionBalancePreview,
} from "../../Utils";
import TransactionMerchantField from "../components/TransactionMerchantField";
export default function BasicInfoTab({
  disabled = false,
  balances,
  account,
}: {
  disabled?: boolean;
  balances: string[];
  account?: User;
}) {
  const { t } = useTranslation("transactionsApp"),
    { control, watch, setValue } = useFormContext<ITransaction>(),
    values = watch(),
    preview = transactionBalancePreview(values, account);
  const operationOptions =
    values.type === "deposit"
      ? depositTransactionTypes
      : withdrawTransactionTypes;
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-24">
      <div className="md:col-span-3 space-y-16">
        <Typography className="text-18 font-semibold">
          {t("TRANSACTION_DETAILS")}
        </Typography>
        <TransactionMerchantField disabled={disabled} />
        <Controller
          name="relatedBalance"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              select
              required
              disabled={disabled}
              label={t("BALANCE_TYPE")}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              onChange={(event) => {
                field.onChange(event.target.value);
                setValue("operationType", "custom", { shouldDirty: true });
              }}
            >
              {Array.from(new Set([...balances, values.relatedBalance]))
                .filter(Boolean)
                .map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                    disabled={!balances.includes(value)}
                  >
                    {t(toRelatedBalanceTypeTitle(value))}
                  </MenuItem>
                ))}
            </TextField>
          )}
        />
        <Controller
          name="type"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              select
              required
              disabled={disabled}
              label={t("TRANSACTION_TYPE")}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              onChange={(event) => {
                field.onChange(event.target.value);
                setValue("operationType", "custom", { shouldDirty: true });
              }}
            >
              {Object.values(transactionTypes).map((value) => (
                <MenuItem key={value} value={value}>
                  {t(toTransactionTypeTitle(value))}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="amount"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ""}
              fullWidth
              required
              disabled={disabled}
              type="number"
              label={t("TRANSACTION_AMOUNT")}
              inputProps={{ step: "any" }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {getCurrentCurrency()}
                  </InputAdornment>
                ),
              }}
              onChange={(event) =>
                field.onChange(
                  event.target.value === ""
                    ? undefined
                    : Number(event.target.value),
                )
              }
            />
          )}
        />
        {values.relatedBalance === "wallet" && values.type === "deposit" && (
          <Controller
            name="applyTax"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                label={t("APPLY_TAX")}
                control={
                  <Checkbox
                    name={field.name}
                    checked={!!field.value}
                    disabled={disabled}
                    onChange={(_, checked) => field.onChange(checked)}
                  />
                }
              />
            )}
          />
        )}
        {values.relatedBalance === "wallet" && (
          <Controller
            name="operationType"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                select
                disabled={disabled}
                label={t("TRANSACTION_OPERATION_TYPE")}
              >
                {Array.from(
                  new Set([...Object.values(operationOptions), field.value]),
                )
                  .filter(Boolean)
                  .map((value) => (
                    <MenuItem key={value} value={value}>
                      {t(
                        values.type === "deposit"
                          ? toDepositTransactionTypeTitle(value)
                          : toWithdrawTransactionTypeTitle(value),
                      )}
                    </MenuItem>
                  ))}
              </TextField>
            )}
          />
        )}
        <Controller
          name="notes"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ""}
              fullWidth
              multiline
              rows={4}
              disabled={disabled}
              label={t("TRANSACTION_NOTES")}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      </div>
      <div className="md:col-span-2 space-y-16">
        <Typography className="text-18 font-semibold">
          {t("BALANCE_CHANGES")}
        </Typography>
        {[
          ["PREVIOUS_BALANCE", preview.previousBalance, "previous"],
          ["TRANSACTION_AMOUNT", values.amount || 0, "amount"],
          ...(values.applyTax &&
          values.type === "deposit" &&
          values.relatedBalance === "wallet"
            ? [["TAX", preview.taxAmount, "tax"]]
            : []),
          ["BALANCE_AFTER_TRANSACTION", preview.currentBalance, "after"],
        ].map(([label, value, key]) => (
          <div key={key} className="flex flex-wrap justify-between gap-8">
            <Typography>{t(label as string)}</Typography>
            <Typography
              dir="ltr"
              className="font-semibold"
              data-testid={`transaction-preview-${key}`}
            >
              {account ? Currency(value as number) : "—"}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  );
}
