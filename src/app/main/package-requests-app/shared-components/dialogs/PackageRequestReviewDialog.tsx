import { useState } from "react";
import { Alert, Button, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useTranslation } from "react-i18next";
import CustomDialog from "app/shared-components/custom-dialog/CustomDialog";
import FuseLoading from "@fuse/core/FuseLoading";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import Currency from "../../../utils/currencyFormatter";
import {
  useGetPackageRequestQuery,
  useGetPackageRequestsUserQuery,
  useSetPackageRequestStatusMutation,
} from "../../PackageRequestsApi";
import { canReviewPackageRequest } from "../../Utils";
import PackageRequestSummary from "../PackageRequestSummary";
export default function PackageRequestReviewDialog({
  id,
  mode,
  onClose,
}: {
  id: string;
  mode: "view" | "approved" | "rejected";
  onClose: () => void;
}) {
  const { t } = useTranslation("packageRequestsApp"),
    user = useAppSelector(selectUser);
  const canView = hasOperationPermission("package-requests", "view", user);
  const request = useGetPackageRequestQuery(id, {
    skip: !canView,
    refetchOnMountOrArgChange: true,
  });
  const row = request.currentData,
    owned =
      row?.type === "bags" &&
      (user.role !== "user" ||
        row.userId === user.id ||
        row.user?.id === user.id);
  const account = useGetPackageRequestsUserQuery(row?.userId, {
    skip: !canView || !row?.userId || !owned || user.role === "user",
    refetchOnMountOrArgChange: true,
  });
  const [setStatus, updating] = useSetPackageRequestStatusMutation(),
    [error, setError] = useState("");
  const balance = account.currentData?.balance ?? 0;
  const review =
    !request.isError &&
    !request.isFetching &&
    owned &&
    row &&
    canReviewPackageRequest(user, row.status);
  const enough = Boolean(
    account.currentData &&
      !account.isError &&
      !account.isFetching &&
      balance >= (row?.amount ?? 0),
  );
  async function decide(status: "approved" | "rejected") {
    if (
      !review ||
      updating.isLoading ||
      request.isFetching ||
      (status === "approved" && !enough)
    )
      return;
    setError("");
    try {
      await setStatus({ id: row.id, userId: row.userId, status }).unwrap();
      onClose();
    } catch {
      setError(
        t(
          status === "approved"
            ? "SOMETHING_WENT_WRONG_WHEN_CONVERT_TO_CONFIRMED"
            : "SOMETHING_WENT_WRONG_WHEN_CONVERT_TO_REFUSED",
        ),
      );
    }
  }
  return (
    <CustomDialog
      title={
        <span id="package-request-review-title">
          {t(
            mode === "view"
              ? "PACKAGE_REQUEST_DETAILS"
              : mode === "approved"
                ? "CONVERT_TO_CONFIRMED_TITLE"
                : "CONVERT_TO_REFUSED_TITLE",
          )}
        </span>
      }
      closeIcon={!updating.isLoading}
      customCloseAction={() => {
        if (!updating.isLoading) onClose();
      }}
      message={
        <div className="space-y-16 my-16">
          {request.isError || (row && !owned) ? (
            <Alert
              severity="error"
              action={
                request.isError ? (
                  <Button onClick={() => request.refetch()}>
                    {t("RETRY")}
                  </Button>
                ) : undefined
              }
            >
              {t("NO_SUCH_PACKAGE_REQUEST")}
            </Alert>
          ) : !row ? (
            <FuseLoading />
          ) : (
            <PackageRequestSummary request={row} />
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {review && account.isError && (
            <Alert
              severity="error"
              action={
                <Button onClick={() => account.refetch()}>{t("RETRY")}</Button>
              }
            >
              {t("BALANCE_LOAD_ERROR")}
            </Alert>
          )}
          {review &&
            account.currentData &&
            !enough &&
            !account.isFetching &&
            !account.isError && (
              <Alert severity="warning">
                {t("CANT_BE_CONFIRMED_MESSAGE", {
                  amount: Currency(row.amount),
                  balance: Currency(balance),
                })}
              </Alert>
            )}
          {review && mode !== "view" && (
            <Typography>
              {t(
                mode === "approved"
                  ? "CONVERT_TO_CONFIRMED_MESSAGE"
                  : "CONVERT_TO_REFUSED_MESSAGE",
              )}
            </Typography>
          )}
        </div>
      }
      customActions={[
        <Button key="close" disabled={updating.isLoading} onClick={onClose}>
          {t("CANCEL")}
        </Button>,
        ...(review && mode !== "approved"
          ? [
              <LoadingButton
                key="reject"
                color="error"
                variant="contained"
                loading={updating.isLoading}
                disabled={request.isFetching}
                onClick={() => decide("rejected")}
                data-testid="reject-package-request"
              >
                {t("REJECT")}
              </LoadingButton>,
            ]
          : []),
        ...(review && mode !== "rejected"
          ? [
              <LoadingButton
                key="accept"
                color="success"
                variant="contained"
                loading={updating.isLoading}
                disabled={!enough || request.isFetching}
                onClick={() => decide("approved")}
                data-testid="accept-package-request"
              >
                {t("ACCEPT")}
              </LoadingButton>,
            ]
          : []),
      ]}
    />
  );
}
