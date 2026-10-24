import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import CustomDialog from "app/shared-components/custom-dialog/CustomDialog";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  bankTransferApprovalSchema,
  bankTransferRejectionSchema,
} from "../../../models/BankTransferSchema";
import { canReviewBankTransfer } from "../../../Utils";
import { useSetBankTransferStatusMutation } from "../../../BankTransfersApi";
import BankTransferDecisionForm from "./BankTransferDecisionForm";
export default function BankTransferDecisionDialog({
  id,
  userId,
  bank,
  status,
  next,
  onClose,
}: {
  id: string;
  userId?: string;
  bank?: string;
  status: string;
  next: "approved" | "rejected";
  onClose: () => void;
}) {
  const { t } = useTranslation("bankTransfersApp"),
    user = useAppSelector(selectUser);
  const [setStatus, updating] = useSetBankTransferStatusMutation();
  const approval = next === "approved",
    key = approval ? "CONFIRMED" : "REFUSED";
  const defaults = useMemo(
    () => (approval ? { bank: bank || "" } : { notes: "" }),
    [approval, bank],
  );
  return (
    <CustomDialog
      title={
        <span id="bank-transfer-decision-title">
          {t(`CONVERT_TO_${key}_TITLE`)}
        </span>
      }
      successTitle={approval}
      errorTitle={!approval}
      customCloseAction={onClose}
      closeIcon
      form
      formMode="onSubmit"
      formSchema={
        approval ? bankTransferApprovalSchema(t) : bankTransferRejectionSchema()
      }
      formDefaultValues={defaults}
      message={<BankTransferDecisionForm approval={approval} />}
      formSubmitButtonTitle={t("CONVERT")}
      formSubmitButtonProps={
        {
          color: approval ? "success" : "error",
          disabled: updating.isLoading || !canReviewBankTransfer(user, status),
          "data-testid": "bank-transfer-decision-submit",
        } as object
      }
      handleSubmitForm={async (data: { bank?: string; notes?: string }) => {
        if (updating.isLoading || !canReviewBankTransfer(user, status))
          throw t("DECISION_UNAVAILABLE");
        try {
          await setStatus({
            id,
            userId,
            status: next,
            ...(approval ? { bank: data.bank } : { notes: data.notes || "" }),
          }).unwrap();
          return t(`CONVERTED_TO_${key}_SUCCESSFULLY`);
        } catch {
          throw t(`SOMETHING_WENT_WRONG_WHEN_CONVERT_TO_${key}`);
        }
      }}
    />
  );
}
