import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useSetShipmentStatusMutation,
  useAttachShipmentInvoiceMutation,
  useReviewShipmentExtraWeightMutation,
  useDeductShipmentExtraWeightMutation,
  useRequestShipmentCancellationMutation,
  useSettleShipmentCodMutation,
} from "../ShipmentsApi";
import IShipment from "../models/IShipment";
import {
  canUpdateShipment,
  canSettleShipment,
  canReturnShipmentStatus,
  canRequestShipmentCancel,
  canGenerateReturnedShipment,
  shipmentErrorMessage,
  shipmentPath,
} from "../Utils";
import ShipmentSettlementBalance from "./ShipmentSettlementBalance";
export type ShipmentOperation =
  | "settle"
  | "delivered"
  | "processing"
  | "returned"
  | "cancel"
  | "weight"
  | "invoice";
export function ShipmentOperationDialog({
  rows,
  operation,
  onClose,
  permissionFeature = "shipments",
}: {
  rows: IShipment[];
  operation: ShipmentOperation;
  onClose: () => void;
  permissionFeature?: "shipments" | "merchant-dues";
}) {
  const { t } = useTranslation("shipmentsApp"),
    user = useAppSelector(selectUser),
    [status] = useSetShipmentStatusMutation(),
    [settle] = useSettleShipmentCodMutation(),
    [cancel] = useRequestShipmentCancellationMutation(),
    [attach] = useAttachShipmentInvoiceMutation(),
    [review] = useReviewShipmentExtraWeightMutation(),
    [deduct] = useDeductShipmentExtraWeightMutation();
  const [busy, setBusy] = useState(false),
    lock = useRef(false),
    [error, setError] = useState(""),
    [invoice, setInvoice] = useState(rows[0]?.closeInvoiceNumber || ""),
    [weight, setWeight] = useState(""),
    [fee, setFee] = useState(""),
    [reviewedWeight, setReviewedWeight] = useState(""),
    [done, setDone] = useState<string[]>([]),
    doneRef = useRef(new Set<string>());
  const allowed = (row: IShipment) =>
    operation === "settle"
      ? canSettleShipment(user, row, permissionFeature)
      : operation === "returned"
        ? canReturnShipmentStatus(user, row, permissionFeature)
        : operation === "cancel"
          ? canRequestShipmentCancel(user, row)
          : canUpdateShipment(user, permissionFeature) &&
            (operation === "processing"
              ? ["canceled", "failed"].includes(row.status)
              : operation === "delivered"
                ? row.status !== "delivered" &&
                  (rows.length === 1 || !row.isCod)
                : true);
  const eligible = rows.filter(
      (row) =>
        (permissionFeature !== "merchant-dues" ||
          ["settle", "returned", "processing", "weight"].includes(operation)) &&
        allowed(row),
    ),
    local = rows[0]?.method === "local";
  async function reviewWeight() {
    if (
      lock.current ||
      !canUpdateShipment(user, permissionFeature) ||
      !(Number(weight) > 0)
    )
      return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await review({
        id: rows[0].id,
        weight: Number(weight),
      }).unwrap();
      if (!Number.isFinite(Number(result.extraWeightPrice)))
        throw new Error(t("WEIGHT_REVIEW_ERROR"));
      setFee(String(result.extraWeightPrice));
      setReviewedWeight(weight);
    } catch (e) {
      setError(shipmentErrorMessage(e, t("WEIGHT_REVIEW_ERROR")));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function save() {
    if (lock.current) return;
    setError("");
    if (
      operation === "weight" &&
      (!(Number(weight) > 0) ||
        fee.trim() === "" ||
        !Number.isFinite(Number(fee)) ||
        (local && reviewedWeight !== weight))
    ) {
      setError(t("WEIGHT_REVIEW_REQUIRED"));
      return;
    }
    if (operation === "invoice" && !invoice.trim()) {
      setError(t("REQUIRED_FIELD"));
      return;
    }
    lock.current = true;
    setBusy(true);
    const failures: string[] = [];
    try {
      for (const row of eligible) {
        if (doneRef.current.has(row.id)) continue;
        try {
          if (operation === "settle") await settle(row.shipmentCod.id).unwrap();
          else if (operation === "cancel")
            await cancel({ shipmentId: row.id, userId: row.userId }).unwrap();
          else if (operation === "invoice")
            await attach({
              id: row.id,
              closeInvoiceNumber: invoice.trim(),
            }).unwrap();
          else if (operation === "weight")
            await deduct({
              id: row.id,
              weight: Number(weight),
              extraWeightPrice: Number(fee),
            }).unwrap();
          else await status({ id: row.id, status: operation }).unwrap();
          doneRef.current.add(row.id);
          setDone([...doneRef.current]);
        } catch (e) {
          failures.push(
            `${row.trackingNumber || row.id}: ${shipmentErrorMessage(e, t("SAVE_ERROR"))}`,
          );
        }
      }
      if (failures.length) setError(failures.join("\n"));
      else onClose();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={() => !busy && onClose()}>
      <DialogTitle>{t(`OPERATION_${operation.toUpperCase()}`)}</DialogTitle>
      <DialogContent className="space-y-16">
        <Alert severity="warning">
          {t("CONFIRM_SHIPMENT_OPERATION", {
            count: eligible.length - done.length,
          })}
        </Alert>
        {!!done.length && (
          <Alert severity="success">
            {t("COMPLETED_COUNT", { count: done.length })}
          </Alert>
        )}
        {error && (
          <Alert severity="error" className="whitespace-pre-line">
            {error}
          </Alert>
        )}
        {operation === "settle" &&
          [
            ...new Set(
              eligible
                .filter((row) => !done.includes(row.id))
                .map((row) => row.userId),
            ),
          ].map((id) => (
            <ShipmentSettlementBalance
              key={id}
              rows={eligible.filter(
                (row) => row.userId === id && !done.includes(row.id),
              )}
            />
          ))}
        {operation === "invoice" && (
          <TextField
            fullWidth
            label={t("INVOICE_NUMBER")}
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            disabled={busy}
          />
        )}
        {operation === "weight" && (
          <>
            <TextField
              fullWidth
              type="number"
              label={t("WEIGHT")}
              value={weight}
              disabled={busy}
              onChange={(e) => {
                setWeight(e.target.value);
                setReviewedWeight("");
              }}
            />
            {local && (
              <LoadingButton
                loading={busy}
                disabled={!(Number(weight) > 0)}
                onClick={reviewWeight}
              >
                {t("REVIEW_WEIGHT")}
              </LoadingButton>
            )}
            <TextField
              fullWidth
              type="number"
              label={t("EXTRA_WEIGHT_PRICE")}
              value={fee}
              disabled={busy || local}
              onChange={(e) => setFee(e.target.value)}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={onClose}>
          {t("CLOSE")}
        </Button>
        <LoadingButton
          loading={busy}
          disabled={!eligible.length}
          onClick={save}
          data-testid="confirm-shipment-operation"
        >
          {t("CONFIRM")}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
export default function ShipmentOperations({ row }: { row: IShipment }) {
  const user = useAppSelector(selectUser),
    { t } = useTranslation("shipmentsApp"),
    { shippingCompanyId = "all", shippingType = "all" } = useParams(),
    [anchor, setAnchor] = useState<HTMLElement>(null),
    [operation, setOperation] = useState<ShipmentOperation>();
  const update = canUpdateShipment(user),
    items: ShipmentOperation[] = [
      ...(canSettleShipment(user, row) ? ["settle" as const] : []),
      ...(update && ["canceled", "failed"].includes(row.status)
        ? ["processing" as const]
        : []),
      ...(update && row.status !== "delivered" ? ["delivered" as const] : []),
      ...(canReturnShipmentStatus(user, row) ? ["returned" as const] : []),
      ...(canRequestShipmentCancel(user, row) ? ["cancel" as const] : []),
      ...(update ? ["weight" as const, "invoice" as const] : []),
    ];
  const returned = canGenerateReturnedShipment(user, row);
  return (
    <>
      {(items.length > 0 || returned) && (
        <Button
          size="small"
          aria-label={t("SHIPMENT_ACTIONS")}
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          {t("ACTIONS")}
        </Button>
      )}
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {items.map((item) => (
          <MenuItem
            key={item}
            onClick={() => {
              setAnchor(null);
              setOperation(item);
            }}
          >
            {t(`OPERATION_${item.toUpperCase()}`)}
          </MenuItem>
        ))}
        {returned && (
          <MenuItem
            component={Link}
            to={`${shipmentPath(shippingCompanyId, shippingType, "new")}?returnFrom=${row.id}`}
            onClick={() => setAnchor(null)}
          >
            {t("GENERATE_RETURN_SHIPMENT")}
          </MenuItem>
        )}
      </Menu>
      {operation && (
        <ShipmentOperationDialog
          rows={[structuredClone(row)]}
          operation={operation}
          onClose={() => setOperation(undefined)}
        />
      )}
    </>
  );
}
