import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { useSetCancelShipmentRequestStatusMutation } from "../CancelShipmentRequestsApi";
import { canReviewCancellationRequest } from "../Utils";
import { shipmentErrorMessage } from "../../shipments-app/Utils";
export default function CancellationDecisionDialog({
  id,
  status,
  shipmentId,
  next,
  onClose,
}: {
  id: string;
  status: string;
  shipmentId?: string;
  next: "approved" | "rejected";
  onClose: () => void;
}) {
  const { t } = useTranslation("cancelShipmentRequestsApp"),
    user = useAppSelector(selectUser),
    [save, { isLoading }] = useSetCancelShipmentRequestStatusMutation(),
    [error, setError] = useState(""),
    busy = useRef(false);
  const allowed = canReviewCancellationRequest(user, { id, status });
  async function submit() {
    if (!allowed || busy.current) return;
    busy.current = true;
    setError("");
    try {
      await save({ id, status: next, shipmentId }).unwrap();
      onClose();
    } catch (e) {
      setError(shipmentErrorMessage(e, t("SAVE_ERROR")));
    } finally {
      busy.current = false;
    }
  }
  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      onClose={() => !isLoading && onClose()}
    >
      <DialogTitle>
        {t(
          next === "approved"
            ? "CONVERT_TO_CONFIRMED_TITLE"
            : "CONVERT_TO_REFUSED_TITLE",
        )}
      </DialogTitle>
      <DialogContent className="space-y-16">
        <Alert severity="warning">
          {t(
            next === "approved"
              ? "CONVERT_TO_CONFIRMED_MESSAGE"
              : "CONVERT_TO_REFUSED_MESSAGE",
          )}
        </Alert>
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button disabled={isLoading} onClick={onClose}>
          {t("CLOSE")}
        </Button>
        <LoadingButton
          disabled={!allowed}
          loading={isLoading}
          onClick={submit}
          data-testid="confirm-cancellation-decision"
        >
          {t("CONFIRM")}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
