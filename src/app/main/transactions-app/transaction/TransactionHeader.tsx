import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
} from "app/shared-components/feature-header/FeatureHeader";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useTheme } from "@mui/material/styles";
import { hasOperationPermission } from "src/app/auth/permissions";
import { useRef, useState } from "react";
import { Alert, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";

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
  const theme = useTheme();
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
    <FeatureHeader>
      <div className="flex items-center justify-between gap-8 min-w-0">
        <Typography
          className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
          component={Link}
          role="button"
          to={
            hasOperationPermission("merchants", "view", user) && values.userId
              ? `/merchants/${values.userId}/view`
              : `/transactions/${values.userId || "all"}/${values.relatedBalance || "wallet"}`
          }
          color="inherit"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="flex mx-4 font-medium">{t("TRANSACTIONS")}</span>
        </Typography>
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="transactions-app">
            {t("EDIT_WALLET_BALANCE")}

            {values.user ? ` — ${transactionUserLabel(values.user)}` : ""}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {canEdit && (
            <>
              <LoadingButton
                color="primary"
                variant="contained"
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                data-testid="save-transaction"
                loading={busy}
                disabled={!accountReady || saved}
                onClick={onSave}
              >
                {t(isNew ? "CREATE_TRANSACTION" : "SAVE")}
              </LoadingButton>
            </>
          )}
        </FeatureHeaderActions>
      </FeatureHeaderRow>

      {failed && (
        <>
          <Alert severity="error">{t("SAVE_ERROR")}</Alert>
        </>
      )}
    </FeatureHeader>
  );
}
