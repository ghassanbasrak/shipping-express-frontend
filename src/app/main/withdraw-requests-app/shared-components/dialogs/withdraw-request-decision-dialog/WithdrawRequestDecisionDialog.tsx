import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import CustomDialog from "app/shared-components/custom-dialog/CustomDialog";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { withdrawRequestApprovalSchema } from "../../../models/WithdrawRequestSchema";
import { canReviewWithdrawRequest } from "../../../Utils";
import { useSetWithdrawRequestStatusMutation } from "../../../WithdrawRequestsApi";
import WithdrawRequestDecisionForm from "./WithdrawRequestDecisionForm";
export default function WithdrawRequestDecisionDialog({
  id,
  type,
  userId,
  bank,
  transactionReference,
  transactionDescription,
  transactionImageUrl,
  description,
  status,
  next,
  onClose,
}: {
  id: string;
  type: string;
  userId?: string;
  bank?: string;
  transactionReference?: string;
  transactionDescription?: string;
  transactionImageUrl?: string;
  description?: string;
  status: string;
  next: "approved" | "rejected";
  onClose: () => void;
}) {
  const { t } = useTranslation("withdrawRequestsApp"),
    user = useAppSelector(selectUser);
  const [setStatus, updating] = useSetWithdrawRequestStatusMutation();
  const [uploading, setUploading] = useState(false);
  const approval = next === "approved",
    key = approval ? "CONFIRMED" : "REFUSED";
  const defaults = useMemo(
    () => ({
      bank: bank || "",
      transactionReference: transactionReference || "",
      transactionDescription: transactionDescription || "",
      transactionImageUrl: transactionImageUrl || "",
    }),
    [bank, transactionReference, transactionDescription, transactionImageUrl],
  );
  const busy = uploading || updating.isLoading;
  return (
    <CustomDialog
      title={
        <span id="withdraw-request-decision-title">
          {t(`CONVERT_TO_${key}_TITLE`)}
        </span>
      }
      successTitle={approval}
      errorTitle={!approval}
      customCloseAction={() => {
        if (!busy) onClose();
      }}
      closeIcon={!busy}
      form
      formMode="onSubmit"
      formSchema={
        approval
          ? withdrawRequestApprovalSchema(t, type === "walletCharge")
          : z.object({})
      }
      formDefaultValues={defaults}
      message={
        <WithdrawRequestDecisionForm
          approval={approval}
          walletCharge={type === "walletCharge"}
          description={description}
          disabled={busy}
          onUploading={setUploading}
        />
      }
      formSubmitButtonTitle={t("CONVERT")}
      formCancelButtonProps={{ disabled: busy }}
      formSubmitButtonProps={{
        color: approval ? "success" : "error",
        disabled: busy || !canReviewWithdrawRequest(user, status),
        ...{ "data-testid": "withdraw-request-decision-submit" },
      }}
      handleSubmitForm={async (data: {
        bank?: string;
        transactionReference?: string;
        transactionDescription?: string;
        transactionImageUrl?: string;
      }) => {
        if (busy || !canReviewWithdrawRequest(user, status))
          throw t("DECISION_UNAVAILABLE");
        try {
          await setStatus({
            id,
            userId,
            status: next,
            ...(approval && type !== "walletCharge" ? data : {}),
          }).unwrap();
          return t(`CONVERTED_TO_${key}_SUCCESSFULLY`);
        } catch {
          throw t(`SOMETHING_WENT_WRONG_WHEN_CONVERT_TO_${key}`);
        }
      }}
    />
  );
}
