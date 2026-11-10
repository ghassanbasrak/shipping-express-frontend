import { Alert, Button } from "@mui/material";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FuseLoading from "@fuse/core/FuseLoading";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { useGetTopupRequestQuery } from "./TopupRequestsApi";
import { ownsTopupRequest } from "./Utils";
import PaymentResultTab from "./topup-request/tabs/PaymentResultTab";
import StoragePaymentResult from "../storage-app/StoragePaymentResult";
export default function PaymentReturn() {
  const [params] = useSearchParams(),
    user = useAppSelector(selectUser),
    { t } = useTranslation("topupRequestsApp"),
    paymentId = params.get("paymentId"),
    gatewayId = params.get("id"),
    query = useGetTopupRequestQuery(paymentId, {
      skip: !paymentId || user.role !== "user",
      refetchOnMountOrArgChange: true,
    });
  if (user.role !== "user") return <Navigate to="/home" replace />;
  if (!query.currentData && query.isFetching) return <FuseLoading />;
  if (
    !paymentId ||
    !gatewayId ||
    query.isError ||
    !ownsTopupRequest(user, query.currentData) ||
    (query.currentData.id || query.currentData._id) !== paymentId
  )
    return (
      <div className="p-24 max-w-2xl mx-auto">
        <Alert
          severity="error"
          action={
            paymentId &&
            gatewayId &&
            query.isError && (
              <Button onClick={() => query.refetch()}>{t("RETRY")}</Button>
            )
          }
        >
          {t(
            !paymentId || !gatewayId
              ? "INCOMPLETE_RETURN"
              : "NO_SUCH_TOPUP_REQUEST",
          )}
        </Alert>
        <Button component={Link} to="/topup-requests/all">
          {t("GO_TO_TOPUP_REQUESTS")}
        </Button>
      </div>
    );
  return query.currentData.storagePlanId ? (
    <StoragePaymentResult />
  ) : (
    <div className="p-16 sm:p-24">
      <PaymentResultTab id={paymentId} gatewayId={gatewayId} />
    </div>
  );
}
