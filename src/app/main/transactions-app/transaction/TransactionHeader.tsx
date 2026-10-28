import { hasOperationPermission } from "src/app/auth/permissions";
import { useRef, useState } from "react";
import { Alert, Button, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
} from "../TransactionsApi";
import ITransaction from "../models/ITransaction";
import {
  canManageTransaction,
  transactionSaveValues,
  transactionUserLabel,
} from "../Utils";
export default function TransactionHeader({
  canEdit,
  isNew,
  accountReady,
}: {
  canEdit: boolean;
  isNew: boolean;
  accountReady: boolean;
}) {
  const { t } = useTranslation("transactionsApp"),
    { watch, handleSubmit } = useFormContext<ITransaction>(),
    values = watch(),
    navigate = useNavigate(),
    user = useAppSelector(selectUser);
  const [create, creating] = useCreateTransactionMutation(),
    [update, updating] = useUpdateTransactionMutation(),
    [failed, setFailed] = useState(false),
    [saved, setSaved] = useState(false),
    pending = useRef(false);
  const busy = creating.isLoading || updating.isLoading;
  const onSave = handleSubmit(async (value) => {
    if (
      !canEdit ||
      !accountReady ||
      pending.current ||
      saved ||
      !canManageTransaction(user, value.relatedBalance, !isNew)
    )
      return;
    pending.current = true;
    setFailed(false);
    try {
      const payload = transactionSaveValues(value, t);
      await (
        isNew ? create(payload) : update({ id: value.id, value: payload })
      ).unwrap();
      setSaved(true);
      navigate(
        hasOperationPermission("merchants", "view", user)
          ? `/merchants/${value.userId}/view`
          : `/transactions/${value.userId}/${value.relatedBalance}`,
        {
          replace: true,
        },
      );
    } catch {
      setFailed(true);
    } finally {
      pending.current = false;
    }
  });
  return (
    <div className="flex flex-col w-full flex-1 gap-16 p-24 sm:p-32">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-w-0"
        >
          <Button
            component={Link}
            to={
              hasOperationPermission("merchants", "view", user) && values.userId
                ? `/merchants/${values.userId}/view`
                : `/transactions/${values.userId || "all"}/${values.relatedBalance || "wallet"}`
            }
            color="inherit"
          >
            {t("TRANSACTIONS")}
          </Button>
          <Typography className="text-20 sm:text-24 font-semibold">
            {t("EDIT_WALLET_BALANCE")}
            {values.user ? ` — ${transactionUserLabel(values.user)}` : ""}
          </Typography>
        </motion.div>
        {canEdit && (
          <LoadingButton
            variant="contained"
            className="whitespace-nowrap shrink-0"
            data-testid="save-transaction"
            loading={busy}
            disabled={!accountReady || saved}
            onClick={onSave}
          >
            {t(isNew ? "CREATE_TRANSACTION" : "SAVE")}
          </LoadingButton>
        )}
      </div>
      {failed && <Alert severity="error">{t("SAVE_ERROR")}</Alert>}
    </div>
  );
}
