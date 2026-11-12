import SupplyReviewDialog from "./SupplyReviewDialog";
import { useState } from "react";
import { Alert, Button, Chip, Paper, Typography } from "@mui/material";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import Currency from "../../utils/currencyFormatter";
import { useGetSupplyRequestsQuery, type ReviewSupplyArg } from "../StorageApi";
import {
  allowedSupplyTransitions,
  canManageStorage,
  merchantContactUrl,
  toSupplyStatusColor,
  toSupplyStatusTitle,
  toStorageTypeTitle,
  toStorageTypeColor,
  supplyStatuses,
} from "../Utils";
import StorageHeader from "../shared/StorageHeader";
import WarehouseMap from "../shared/WarehouseMap";
export default function SupplyRequestView() {
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
  const [dialog, setDialog] = useState<ReviewSupplyArg>();
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
                    variant={
                      status === supplyStatuses.rejected
                        ? "outlined"
                        : "contained"
                    }
                    color={
                      status === supplyStatuses.rejected ? "error" : "primary"
                    }
                    onClick={() => {
                      setDialog({
                        id: row.id,
                        status,
                      });
                    }}
                    data-testid={"supply-status-" + status}
                  >
                    {t(
                      status === supplyStatuses.approved
                        ? "APPROVE"
                        : status === supplyStatuses.received
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
          {row.status === supplyStatuses.received && (
            <Alert severity="success">{t("RECEIPT_APPLIED")}</Alert>
          )}
          <Paper
            elevation={0}
            className="p-24 sm:p-32 rounded-24 grid grid-cols-1 sm:grid-cols-3 gap-24"
            sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
          >
            {[
              ["PRODUCTS_COUNT", row.products.length],
              ["QUANTITY", row.products.reduce((n, p) => n + p.quantity, 0)],
              [
                "PRODUCTS_VALUE",
                Currency(
                  row.products.reduce(
                    (n, p) => n + p.quantity * (p.unitPrice || 0),
                    0,
                  ),
                ),
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <Typography className="text-12 opacity-80">
                  {t(label as string)}
                </Typography>
                <Typography className="text-28 font-bold">{value}</Typography>
              </div>
            ))}
          </Paper>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <Paper variant="outlined" className="p-20 rounded-16 space-y-12">
              <Typography className="text-16 font-semibold">
                {t("WAREHOUSE")}
              </Typography>
              <Typography
                component={user.role === "admin" ? Link : "span"}
                to={
                  user.role === "admin"
                    ? "/storage/warehouses/" + row.warehouseId
                    : undefined
                }
                color="primary"
                className="text-20 font-bold"
              >
                {row.warehouse?.name || row.warehouseId}
              </Typography>
              <Typography color="text.secondary">
                {row.warehouse?.pickup?.street}
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
                <Typography
                  component={Link}
                  to={`/merchants/${row.userId}/view`}
                  color="primary"
                  className="underline"
                >
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
                    <Typography
                      component={user.role === "admin" ? Link : "span"}
                      to={
                        user.role === "admin"
                          ? item.warehouseProductId
                            ? `/storage/products/${item.warehouseProductId}`
                            : `/storage/products?warehouseId=${encodeURIComponent(row.warehouseId)}`
                          : undefined
                      }
                      className="font-semibold text-16"
                      color="primary"
                    >
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
                  <div>
                    <Chip
                      size="small"
                      label={t(toStorageTypeTitle(item.storageType))}
                      className={
                        toStorageTypeColor(item.storageType) + " text-white"
                      }
                    />
                  </div>
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
          {dialog && (
            <SupplyReviewDialog
              decision={dialog}
              onClose={() => setDialog(undefined)}
            />
          )}
        </div>
      }
      scroll="normal"
    />
  );
}
