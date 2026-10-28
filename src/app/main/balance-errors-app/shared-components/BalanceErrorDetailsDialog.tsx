import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import Currency from "../../utils/currencyFormatter";
import IBalanceError from "../models/IBalanceError";
import {
  balanceErrorDate,
  balanceErrorText,
  balanceErrorNumber,
} from "../Utils";
export default function BalanceErrorDetailsDialog({
  transaction,
  onClose,
}: {
  transaction: IBalanceError;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation("balanceErrorsApp"),
    fields = [
      ["USER_EMAIL", transaction.user?.email || t("UNKNOWN")],
      ["TRANSACTION_NUMBER", balanceErrorNumber(transaction) || t("N_A")],
      ["AMOUNT", Currency(transaction.amount ?? 0)],
      ["TRANSACTION_TYPE", transaction.type || t("N_A")],
      ["DATE", balanceErrorDate(transaction.createdAt) || t("N_A")],
      ["PREVIOUS_BALANCE", Currency(transaction.previousBalance ?? 0)],
      ["CURRENT_BALANCE", Currency(transaction.currentBalance ?? 0)],
      [
        "TITLE",
        balanceErrorText(transaction.title, i18n.language) ||
          t("NO_TITLE_AVAILABLE"),
      ],
      [
        "DESCRIPTION",
        balanceErrorText(transaction.description, i18n.language) ||
          t("NO_DESCRIPTION_AVAILABLE"),
      ],
      ["NOTES", transaction.notes || t("NO_NOTES_AVAILABLE")],
      ...(transaction.reference ? [["REFERENCE", transaction.reference]] : []),
    ];
  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="balance-error-details-title"
    >
      <DialogTitle id="balance-error-details-title">
        {t("ERROR_DETAILS")}
      </DialogTitle>
      <DialogContent className="grid grid-cols-1 sm:grid-cols-2 gap-24">
        {fields.map(([title, value]) => (
          <div key={title} className="min-w-0">
            <Typography className="font-semibold" color="text.secondary">
              {t(title)}
            </Typography>
            <Typography
              className="break-words whitespace-pre-wrap"
              data-testid={`balance-detail-${title}`}
              color={
                title === "AMOUNT"
                  ? transaction.amount < 0
                    ? "error.main"
                    : "success.main"
                  : undefined
              }
            >
              {value}
            </Typography>
          </div>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("CLOSE")}</Button>
      </DialogActions>
    </Dialog>
  );
}
