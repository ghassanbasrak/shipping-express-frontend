import type { AffiliateWithdrawViewFeature } from "../../../Utils";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import CustomDialog from "app/shared-components/custom-dialog/CustomDialog";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { affiliateWithdrawRequestApprovalSchema } from "../../../models/AffiliateWithdrawRequestSchema";
import { canReviewAffiliateWithdrawRequest } from "../../../Utils";
import { useSetAffiliateWithdrawRequestStatusMutation } from "../../../AffiliateWithdrawRequestsApi";
import AffiliateWithdrawRequestDecisionForm from "./AffiliateWithdrawRequestDecisionForm";
export default function AffiliateWithdrawRequestDecisionDialog({
  viewFeature = "affiliate-withdraw-requests",
  id,
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
  viewFeature?: AffiliateWithdrawViewFeature;
  id: string;
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
  const { t } = useTranslation("affiliateWithdrawRequestsApp"),
    user = useAppSelector(selectUser);
  const [setStatus, updating] = useSetAffiliateWithdrawRequestStatusMutation();
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
        <span id="affiliate-withdraw-request-decision-title">
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
        approval ? affiliateWithdrawRequestApprovalSchema(t) : z.object({})
      }
      formDefaultValues={defaults}
      message={
        <AffiliateWithdrawRequestDecisionForm
          approval={approval}
          description={description}
          disabled={busy}
          onUploading={setUploading}
        />
      }
      formSubmitButtonTitle={t("CONVERT")}
      formCancelButtonProps={{ disabled: busy }}
      formSubmitButtonProps={{
        color: approval ? "success" : "error",
        disabled:
          busy || !canReviewAffiliateWithdrawRequest(user, status, viewFeature),
        ...{ "data-testid": "affiliate-withdraw-request-decision-submit" },
      }}
      handleSubmitForm={async (data: {
        bank?: string;
        transactionReference?: string;
        transactionDescription?: string;
        transactionImageUrl?: string;
      }) => {
        if (
          busy ||
          !canReviewAffiliateWithdrawRequest(user, status, viewFeature)
        )
          throw t("DECISION_UNAVAILABLE");
        try {
          await setStatus({
            id,
            userId,
            status: next,
            ...(approval ? data : {}),
          }).unwrap();
          return t(`CONVERTED_TO_${key}_SUCCESSFULLY`);
        } catch {
          throw t(`SOMETHING_WENT_WRONG_WHEN_CONVERT_TO_${key}`);
        }
      }}
    />
  );
}
