import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useGetSupplyRequestsQuery,
  useReviewSupplyRequestMutation,
  type ReviewSupplyArg,
} from "../StorageApi";
import {
  allowedSupplyTransitions,
  storageError,
  supplyStatuses,
} from "../Utils";
export default function SupplyReviewDialog({
  decision,
  onClose,
}: {
  decision: ReviewSupplyArg;
  onClose: () => void;
}) {
  const { t } = useTranslation("storageApp"),
    user = useAppSelector(selectUser),
    lock = useRef(false),
    [error, setError] = useState(""),
    [checking, setChecking] = useState(false);
  const query = useGetSupplyRequestsQuery({ admin: true, userId: user.id }),
    [review, writing] = useReviewSupplyRequestMutation();
  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      onClose={() => {
        if (!lock.current) onClose();
      }}
    >
      <DialogTitle>
        {t(
          decision.status === supplyStatuses.received
            ? "CONFIRM_RECEIPT"
            : "CONFIRM_REVIEW",
        )}
      </DialogTitle>
      <DialogContent className="space-y-16">
        <Typography>
          {t(
            decision.status === supplyStatuses.received
              ? "RECEIPT_CONFIRM_HINT"
              : "REVIEW_CONFIRM_HINT",
          )}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button
          disabled={checking || writing.isLoading}
          onClick={() => {
            if (!lock.current) onClose();
          }}
        >
          {t("CANCEL")}
        </Button>
        <LoadingButton
          loading={checking || writing.isLoading}
          variant="contained"
          onClick={async () => {
            if (user.role !== "admin" || lock.current) return;
            lock.current = true;
            setChecking(true);
            setError("");
            try {
              const rows = await query.refetch().unwrap(),
                current = rows.find((r) => r.id === decision.id);
              if (
                !current ||
                !allowedSupplyTransitions(current.status).includes(
                  decision.status,
                )
              )
                throw new Error(t("SUPPLY_STATUS_CHANGED"));
              await review(decision).unwrap();
              onClose();
            } catch (e) {
              setError(storageError(e, t("SAVE_ERROR")));
            } finally {
              lock.current = false;
              setChecking(false);
            }
          }}
        >
          {t("CONFIRM")}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
