import {
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import ShipmentTransactionsTable from "app/shared-components/ShipmentTransactionsTable";
import { useGetShipmentTransactionsQuery } from "../../shipments-app/ShipmentsApi";
import { canViewCancellationTransactions } from "../Utils";
export default function CancellationTransactionsDialog({
  id,
  userId,
  trackingNumber,
  onClose,
}: {
  id: string;
  userId: string;
  trackingNumber: string;
  onClose: () => void;
}) {
  const { t } = useTranslation("cancelShipmentRequestsApp"),
    user = useAppSelector(selectUser),
    allowed = canViewCancellationTransactions(user, {
      id,
      userId,
      shipment: { id: "", trackingNumber },
    });
  const query = useGetShipmentTransactionsQuery(
    { trackingNumber, userId },
    { skip: !allowed, refetchOnMountOrArgChange: true },
  );
  return (
    <Dialog open fullWidth maxWidth="xl" onClose={onClose}>
      <DialogTitle>
        {t("TRANSACTIONS_OF_SHIPMENT", { trackingNumber })}
      </DialogTitle>
      <DialogContent>
        {query.isError && (
          <Alert
            severity="error"
            action={
              <Button onClick={() => query.refetch()}>{t("RETRY")}</Button>
            }
          >
            {t("TRANSACTIONS_LOAD_ERROR")}
          </Alert>
        )}
        {allowed && (
          <ShipmentTransactionsTable
            transactions={query.currentData?.results || []}
            loading={query.isFetching}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("CLOSE")}</Button>
      </DialogActions>
    </Dialog>
  );
}
