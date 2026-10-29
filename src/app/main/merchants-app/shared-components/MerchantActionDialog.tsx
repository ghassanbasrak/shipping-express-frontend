import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import CustomDialog from "app/shared-components/custom-dialog/CustomDialog";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  requiredStringValidation,
  optionalStringValidation,
} from "../../utils/validations";
import { useGetPlansQuery } from "../../plans-app/PlansApi";
import IMerchant from "../models/IMerchant";
import {
  canUpdateMerchant,
  canBlockMerchant,
  canConvertMerchant,
  canLockMerchantBalance,
  merchantName,
} from "../Utils";
import {
  useSetMerchantBlockedMutation,
  useSetMerchantAffiliateMutation,
  useConvertMerchantToEmployeeMutation,
  useAddMerchantPaymentPlanMutation,
  useCancelMerchantPaymentPlanMutation,
  useCloseMerchantBalanceMutation,
} from "../MerchantsApi";
export type MerchantAction =
  | "block"
  | "affiliate"
  | "subscribe"
  | "cancelPlan"
  | "closeBalance"
  | "convert";
function ActionFields({
  action,
  merchant,
  busy,
}: {
  action: MerchantAction;
  merchant: IMerchant;
  busy: boolean;
}) {
  const { t } = useTranslation("merchantsApp"),
    { control, getValues, setValue } = useFormContext(),
    plans = useGetPlansQuery(
      { page: 0, pageSize: 500 },
      { skip: action !== "subscribe" },
    );
  useEffect(() => {
    if (
      action === "subscribe" &&
      !getValues("paymentPlanId") &&
      plans.currentData?.results[0]
    )
      setValue("paymentPlanId", plans.currentData.results[0].id);
  }, [plans.currentData, action]);
  return (
    <div className="space-y-16 mt-16">
      <Typography>{merchantName(merchant)}</Typography>
      {action === "convert" && (
        <Typography>{t("CONVERT_TO_EMPLOYEE_MESSAGE")}</Typography>
      )}
      {action === "cancelPlan" && (
        <Typography>{t("CANCEL_PAYMENT_PLAN_MESSAGE")}</Typography>
      )}
      {action === "subscribe" && (
        <>
          {merchant.referredById && (
            <Alert severity="warning">
              {t("THE_AFFILIATE_CUSTOM_PRICES_WILL_BE_REMOVED_WITH_PLAN")}
            </Alert>
          )}
          {plans.isError && (
            <Alert
              severity="error"
              action={
                <Button onClick={() => plans.refetch()}>{t("RETRY")}</Button>
              }
            >
              {t("LOOKUP_ERROR")}
            </Alert>
          )}
          <Controller
            name="paymentPlanId"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                select
                disabled={busy || plans.isFetching || plans.isError}
                label={t("PAYMENT_PLAN")}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {(plans.currentData?.results || []).map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </>
      )}
      {action === "closeBalance" && (
        <>
          <Typography>{t("LOCK_MERCHANT_BALANCE_MESSAGE")}</Typography>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                disabled={busy}
                label={t("MERCHANT_BALANCE_TYPE")}
              >
                <MenuItem value="wallet">{t("BALANCE")}</MenuItem>
                <MenuItem value="cod">{t("COD_BALANCE")}</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={3}
                disabled={busy}
                label={t("TRANSACTION_NOTES")}
              />
            )}
          />
        </>
      )}
    </div>
  );
}
export default function MerchantActionDialog({
  action,
  merchant,
  onClose,
  onFinish,
}: {
  action: MerchantAction;
  merchant: IMerchant;
  onClose: () => void;
  onFinish?: () => void;
}) {
  const { t } = useTranslation("merchantsApp"),
    user = useAppSelector(selectUser),
    [busy, setBusy] = useState(false),
    [block] = useSetMerchantBlockedMutation(),
    [affiliate] = useSetMerchantAffiliateMutation(),
    [convert] = useConvertMerchantToEmployeeMutation(),
    [subscribe] = useAddMerchantPaymentPlanMutation(),
    [cancel] = useCancelMerchantPaymentPlanMutation(),
    [closeBalance] = useCloseMerchantBalanceMutation();
  const allowed =
    action === "convert"
      ? canConvertMerchant(user)
      : action === "block" || action === "affiliate"
        ? canBlockMerchant(user)
        : action === "closeBalance"
          ? canLockMerchantBalance(user)
          : canUpdateMerchant(user);
  const title = {
    block: merchant.isBlocked ? "ACTIVATE_ACCOUNT" : "DEACTIVATE_ACCOUNT",
    affiliate: merchant.isAffiliate
      ? "DEACTIVATE_AFFILIATE"
      : "ACTIVATE_AFFILIATE",
    subscribe: "SUBSCRIBE_PLAN_TITLE",
    cancelPlan: "CANCEL_PAYMENT_PLAN_TITLE",
    closeBalance: "LOCK_MERCHANT_BALANCE",
    convert: "CONVERT_TO_EMPLOYEE_TITLE",
  }[action];
  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      aria-labelledby="merchant-action-title"
    >
      <CustomDialog
        title={<span id="merchant-action-title">{t(title)}</span>}
        closeIcon={!busy}
        customCloseAction={() => {
          if (!busy) onClose();
        }}
        form
        formMode="onSubmit"
        formDefaultValues={{ paymentPlanId: "", type: "wallet", notes: "" }}
        formSchema={
          action === "subscribe"
            ? z.object({
                paymentPlanId: requiredStringValidation({
                  error: t("REQUIRED_FIELD"),
                }),
              })
            : action === "closeBalance"
              ? z.object({
                  type: z.enum(["wallet", "cod"]),
                  notes: optionalStringValidation(),
                })
              : z.object({})
        }
        message={
          <ActionFields action={action} merchant={merchant} busy={busy} />
        }
        formSubmitButtonTitle={t("CONFIRM")}
        formSubmitButtonProps={
          {
            disabled: busy || !allowed,
            "data-testid": "merchant-action-submit",
          } as object
        }
        formCancelButtonProps={{ disabled: busy }}
        handleSubmitForm={async (data: {
          paymentPlanId?: string;
          type?: string;
          notes?: string;
        }) => {
          if (busy || !allowed) throw t("ACTION_UNAVAILABLE");
          setBusy(true);
          try {
            const id = merchant.id;
            if (action === "block")
              await block({ id, isBlocked: !merchant.isBlocked }).unwrap();
            else if (action === "affiliate")
              await affiliate({
                id,
                isAffiliate: !merchant.isAffiliate,
              }).unwrap();
            else if (action === "convert") await convert(id).unwrap();
            else if (action === "subscribe")
              await subscribe({
                id,
                paymentPlanId: data.paymentPlanId,
              }).unwrap();
            else if (action === "cancelPlan") await cancel(id).unwrap();
            else {
              const result = await closeBalance({
                id,
                type: data.type,
                notes: data.notes,
              }).unwrap();
              if (
                !result[
                  data.type === "cod"
                    ? "codBalanceStatus"
                    : "walletBalanceStatus"
                ]
              )
                throw new Error("not closed");
            }
            onFinish?.();
            return t("ACTION_SUCCESS");
          } catch {
            throw t("ACTION_ERROR");
          } finally {
            setBusy(false);
          }
        }}
      />
    </Dialog>
  );
}
