import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import Currency from "../../utils/currencyFormatter";
import {
  useGetSupplyRequestsQuery,
  useReviewSupplyRequestMutation,
  type ReviewSupplyArg,
} from "../StorageApi";
import {
  allowedSupplyTransitions,
  canManageStorage,
  merchantContactUrl,
  storageError,
  toSupplyStatusColor,
  toSupplyStatusTitle,
} from "../Utils";
import StorageHeader from "../shared/StorageHeader";
import WarehouseMap from "../shared/WarehouseMap";
export default function SupplyRequestView() {
  const reviewBusy = useRef(false);
  const { supplyRequestId } = useParams(),
    { t } = useTranslation("storageApp"),
    user = useAppSelector(selectUser);
  const query = useGetSupplyRequestsQuery(
      { admin: user.role === "admin", userId: user.id },
      {
        refetchOnMountOrArgChange: true,
      },
    ),
    row = query.currentData?.find((row) => row.id === supplyRequestId);
  const [review, writing] = useReviewSupplyRequestMutation(),
    [dialog, setDialog] = useState<ReviewSupplyArg>(),
    [error, setError] = useState("");
  if (query.isError)
    return (
      <div className="p-24">
        <Alert
          severity="error"
          action={<Button onClick={() => query.refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      </div>
    );
  if (!row && query.isFetching) return <FuseLoading />;
  if (!row) return <Navigate to="/storage/supply-requests" replace />;
  if (
    row.id !== supplyRequestId ||
    (user.role === "user" && row.userId !== user.id)
  )
    return <Navigate to="/error/401" replace />;
  const contact = merchantContactUrl(row.user?.phone),
    transitions = allowedSupplyTransitions(row.status);
  return (
    <FusePageCarded
      header={
        <StorageHeader
          title={t("REQUEST_NUMBER") + " " + row.id.slice(-8)}
          back="/storage/supply-requests"
          description={t("SUPPLY_DETAILS")}
          actions={
            <>
              <Chip
                label={t(toSupplyStatusTitle(row.status))}
                className={toSupplyStatusColor(row.status) + " text-white"}
              />
              {canManageStorage(user) && (
                <Button
                  component="a"
                  href={contact}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  color="primary"
                  disabled={!contact}
                >
                  {t("CONTACT_MERCHANT")}
                </Button>
              )}
              {canManageStorage(user, "update") &&
                transitions.map((status: ReviewSupplyArg["status"]) => (
                  <Button
                    key={status}
                    variant={status === "rejected" ? "outlined" : "contained"}
                    color={status === "rejected" ? "error" : "primary"}
                    onClick={() => {
                      setError("");
                      setDialog({
                        id: row.id,
                        status,
                      });
                    }}
                    data-testid={"supply-status-" + status}
                  >
                    {t(
                      status === "approved"
                        ? "APPROVE"
                        : status === "received"
                          ? "RECEIVE"
                          : "REJECT",
                    )}
                  </Button>
                ))}
            </>
          }
        />
      }
      content={
        <div
          className="p-16 sm:p-24 space-y-20"
          data-testid="supply-request-view"
        >
          {row.status === "received" && (
            <Alert severity="success">{t("RECEIPT_APPLIED")}</Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <Paper variant="outlined" className="p-20 rounded-16 space-y-12">
              <Typography className="text-16 font-semibold">
                {t("WAREHOUSE")}
              </Typography>
              <Typography>{row.warehouse?.name || row.warehouseId}</Typography>
              <Typography color="text.secondary">
                {row.warehouse?.address}
              </Typography>
              {row.warehouse && (
                <WarehouseMap address={row.warehouse.mapAddress} />
              )}
            </Paper>
            <Paper variant="outlined" className="p-20 rounded-16 space-y-12">
              <Typography className="text-16 font-semibold">
                {t("REQUEST_INFO")}
              </Typography>
              {user.role === "admin" && (
                <Typography>
                  {t("MERCHANT")}:{" "}
                  {row.user?.companyName ||
                    [row.user?.firstName, row.user?.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    row.userId}
                </Typography>
              )}
              <Typography>
                {t("CREATED_AT")}:{" "}
                {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
              </Typography>
            </Paper>
          </div>
          <Typography className="text-18 font-semibold">
            {t("PRODUCTS")}
          </Typography>
          <div className="space-y-12">
            {row.products.map((item, index) => (
              <Paper key={index} variant="outlined" className="p-20 rounded-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                  <div>
                    <Typography className="font-semibold">
                      {item.name}
                    </Typography>
                    <Typography color="text.secondary" dir="ltr">
                      {item.sku}
                    </Typography>
                  </div>
                  <Typography>
                    {t("QUANTITY")}: {item.quantity}
                  </Typography>
                  <Typography>
                    {t("UNIT_PRICE")}: {Currency(item.unitPrice)}
                  </Typography>
                  <Typography>{item.storageType}</Typography>
                </div>
                {item.notes && (
                  <Typography
                    className="mt-12 whitespace-pre-wrap"
                    color="text.secondary"
                  >
                    {item.notes}
                  </Typography>
                )}
              </Paper>
            ))}
          </div>
          <Typography className="text-18 font-bold">
            {t("PRODUCTS_VALUE")}:{" "}
            {Currency(
              row.products.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0,
              ),
            )}
          </Typography>
          <Dialog
            open={!!dialog}
            fullWidth
            maxWidth="sm"
            onClose={() => {
              if (!writing.isLoading) setDialog(undefined);
            }}
          >
            <DialogTitle>
              {t(
                dialog?.status === "received"
                  ? "CONFIRM_RECEIPT"
                  : "CONFIRM_REVIEW",
              )}
            </DialogTitle>
            <DialogContent className="space-y-16">
              <Typography>
                {t(
                  dialog?.status === "received"
                    ? "RECEIPT_CONFIRM_HINT"
                    : "REVIEW_CONFIRM_HINT",
                )}
              </Typography>
              {error && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
              <Button
                variant="outlined"
                color="primary"
                disabled={writing.isLoading}
                onClick={() => setDialog(undefined)}
              >
                {t("CANCEL")}
              </Button>
              <LoadingButton
                variant="contained"
                color="primary"
                loading={writing.isLoading}
                onClick={async () => {
                  if (
                    reviewBusy.current ||
                    !dialog ||
                    writing.isLoading ||
                    !canManageStorage(user, "update")
                  )
                    return;
                  reviewBusy.current = true;
                  setError("");
                  try {
                    const fresh = await query.refetch().unwrap();
                    const current = fresh.find((item) => item.id === dialog.id);
                    if (
                      !current ||
                      !allowedSupplyTransitions(current.status).includes(
                        dialog.status,
                      )
                    ) {
                      setDialog(undefined);
                      return;
                    }
                    await review(dialog).unwrap();
                    setDialog(undefined);
                  } catch (e) {
                    setError(storageError(e, t("SAVE_ERROR")));
                  } finally {
                    reviewBusy.current = false;
                  }
                }}
                data-testid="confirm-supply-review"
              >
                {t("CONFIRM")}
              </LoadingButton>
            </DialogActions>
          </Dialog>
        </div>
      }
      scroll="normal"
    />
  );
}
