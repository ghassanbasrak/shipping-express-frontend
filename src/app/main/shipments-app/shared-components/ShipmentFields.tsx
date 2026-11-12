import { hasOperationPermission as merchantProfilePermission } from "src/app/auth/permissions";
import { Link } from "react-router-dom";
import { Typography } from "@mui/material";
import { TFunction } from "i18next";
import type { User } from "src/app/auth/user";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import IShipment from "../models/IShipment";
import {
  decompressShipment,
  shipmentPath,
  toShippingTypeTitle,
  toShipmentStatusTitle,
  toShipmentStatusColor,
  toShipmentPaymentStatusTitle,
  toShipmentPaymentStatusColor,
  canUpdateShipment,
  canSettleShipment,
  canReturnShipmentStatus,
  canRequestShipmentCancel,
  canGenerateReturnedShipment,
} from "../Utils";
import type { ShipmentOperation } from "./ShipmentOperations";
export type ShipmentDocumentMode = "label" | "invoice" | "image";
export type ShipmentTableRow = IShipment & {
  actionAccess: Record<string, boolean>;
};
export const toShipmentTableRow = (
  row: IShipment,
  user: User,
): ShipmentTableRow => {
  const view = user.role !== "user" || row.status !== "failed",
    update = canUpdateShipment(user);
  return {
    ...row,
    actionAccess: {
      view,
      label: !!row.trackingNumber && view,
      tracking: !!row.trackingUrl,
      invoiceDocument:
        row.method === "international" &&
        !!row.trackingNumber &&
        !!row.labelUrl,
      image: row.method === "international" && !!row.imageUrl,
      settle: canSettleShipment(user, row),
      processing: update && ["canceled", "failed"].includes(row.status),
      delivered: update && row.status !== "delivered",
      returned: canReturnShipmentStatus(user, row),
      cancel: canRequestShipmentCancel(user, row),
      weight: update,
      invoice: update,
      returnShipment: canGenerateReturnedShipment(user, row),
    },
  };
};
export default function shipmentFields(
  t: TFunction,
  user: User,
  carrier = "all",
  type = "all",
  handlers: {
    onDocument?: (row: IShipment, mode: ShipmentDocumentMode) => void;
    onOperation?: (row: IShipment, operation: ShipmentOperation) => void;
  } = {},
): TableFieldProps<ShipmentTableRow>[] {
  const flat = (row: IShipment) => decompressShipment(row);
  return [
    {
      id: "shippingCompany.name",
      label: t("SHIPPING_COMPANY"),
      type: TableDataTypes.normal,
      flex: 1,
      minWidth: 100,
    },
    {
      id: "method",
      label: t("SHIPPING_TYPE"),
      type: TableDataTypes.normal,
      valueFormatter: (row) => t(toShippingTypeTitle(row.method)),
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "trackingNumber",
      label: t("TRACKING_NUMBER"),
      type: TableDataTypes.normal,
      flex: 1,
      minWidth: 100,
      renderCell: ({ row }) => (
        <div className="space-y-8">
          {user.role !== "user" || row.status !== "failed" ? (
            <Link
              to={shipmentPath(carrier, type, row.id)}
              className="underline"
            >
              {row.trackingNumber || t("PENDING")}
            </Link>
          ) : (
            <Typography>{row.trackingNumber || t("PENDING")}</Typography>
          )}
          {row.returnedFromShipmentId && (
            <Link
              className="block underline"
              to={shipmentPath(carrier, type, row.returnedFromShipmentId)}
            >
              {t("RETURNED_FROM")}:{" "}
              {row.returnedFromShipment?.trackingNumber ||
                row.returnedFromShipmentId}
            </Link>
          )}
          {row.returnedShipmentId && (
            <Link
              className="block underline"
              to={shipmentPath(carrier, type, row.returnedShipmentId)}
            >
              {t("RETURNED_SHIPMENT")}:{" "}
              {row.returnedShipment?.trackingNumber || row.returnedShipmentId}
            </Link>
          )}
          {row.closeInvoiceNumber && (
            <Typography>
              {t("INVOICE_NUMBER")}: {row.closeInvoiceNumber}
            </Typography>
          )}
        </div>
      ),
    },
    ...(user.role !== "user"
      ? [
          {
            id: "user.firstName" as const,
            link: merchantProfilePermission("merchants", "view", user),
            linkGetter: (row) =>
              row.userId || row.user?.id
                ? `/merchants/${encodeURIComponent(row.userId || row.user?.id)}/view`
                : "/merchants",
            label: t("MERCHANT"),
            type: TableDataTypes.normal,
            valueGetter: (row: IShipment) =>
              `${row.user?.firstName || ""} ${row.user?.lastName || ""}`,
            flex: 1.1,
            minWidth: 110,
          },
          {
            id: "platform" as const,
            label: t("PLATFORM"),
            type: TableDataTypes.normal,
            flex: 0.6,
            minWidth: 60,
          },
        ]
      : []),
    ...(user.role === "admin"
      ? [
          {
            id: "updatedBy.firstName" as const,
            label: t("UPDATED_BY"),
            type: TableDataTypes.normal,
            valueGetter: (row: IShipment) =>
              `${row.updatedBy?.firstName || ""} ${row.updatedBy?.lastName || ""}`,
            flex: 1,
            minWidth: 100,
          },
        ]
      : []),
    ...(user.role === "user"
      ? [
          {
            id: "senderName" as const,
            label: t("SENDER"),
            type: TableDataTypes.normal,
            valueGetter: (row: IShipment) => flat(row).senderName,
            link: true,
            linkGetter: (row: IShipment) =>
              row.senderId
                ? `/shipment-users/sender/${row.senderId}`
                : shipmentPath(carrier, type, row.id),
            flex: 1.1,
            minWidth: 110,
          },
        ]
      : []),
    {
      id: "receiverName",
      label: t("RECEIVER"),
      type: TableDataTypes.normal,
      valueGetter: (row) => flat(row).receiverName,
      link: true,
      linkGetter: (row) =>
        row.receiverId
          ? `/shipment-users/receiver/${row.receiverId}`
          : shipmentPath(carrier, type, row.id),
      flex: 1.1,
      minWidth: 110,
    },
    {
      id: "status",
      label: t("STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toShipmentStatusTitle(value)),
      toChipColor: (value) => toShipmentStatusColor(value),
      infoIconGetter: (row) => !!(row.reason || row.trackingText),
      infoContentGetter: (row) => (
        <>
          {row.reason} {row.trackingText}
        </>
      ),
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "codPrice",
      label: t("COD_AMOUNT"),
      type: TableDataTypes.money,
      valueGetter: (row) =>
        row.isCod ? row.shipmentCod?.codPrice ?? row.codPrice : undefined,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "shipmentCod.codStatus",
      label: t("PAYMENT_STATUS"),
      type: TableDataTypes.normal,
      valueGetter: (row) =>
        row.isCod ? row.shipmentCod?.codStatus : undefined,
      valueFormatter: (row) =>
        row.isCod
          ? t(toShipmentPaymentStatusTitle(row.shipmentCod?.codStatus))
          : "",
      chip: true,
      toChipTitle: (value) =>
        value ? t(toShipmentPaymentStatusTitle(value)) : "",
      toChipColor: toShipmentPaymentStatusColor,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "shipmentCod.reference",
      label: t("COD_REFERENCE"),
      type: TableDataTypes.normal,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "shipmentCod.updatedAt",
      label: t("COD_UPDATED_AT"),
      type: TableDataTypes.date,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "shipmentPrice.total",
      label: t("PRICE"),
      type: TableDataTypes.money,
      valueGetter: (row) => row.shipmentPrice?.total,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "createdAt",
      label: t("CREATED_AT"),
      type: TableDataTypes.date,
      withTime: true,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "actions",
      label: t("ACTIONS"),
      type: TableDataTypes.actions,
      exportable: false,
      flex: 1.3,
      minWidth: 130,
      actions: [
        {
          title: t("VIEW"),
          color: "secondary",
          link: true,
          linkGetter: (row) => shipmentPath(carrier, type, row.id),
          conditions: [{ id: "actionAccess.view", equalsTo: true }],
        },
        {
          title: t("LABEL"),
          conditions: [{ id: "actionAccess.label", equalsTo: true }],
          onActionClick: (row) => handlers.onDocument?.(row, "label"),
        },
        {
          title: t("TRACKING"),
          link: true,
          linkGetter: (row) => row.trackingUrl,
          target: "_blank",
          conditions: [{ id: "actionAccess.tracking", equalsTo: true }],
        },
        {
          title: t("INVOICE"),
          conditions: [{ id: "actionAccess.invoiceDocument", equalsTo: true }],
          onActionClick: (row) => handlers.onDocument?.(row, "invoice"),
        },
        {
          title: t("SHIPMENT_IMAGE"),
          conditions: [{ id: "actionAccess.image", equalsTo: true }],
          onActionClick: (row) => handlers.onDocument?.(row, "image"),
        },
        ...(
          [
            "settle",
            "processing",
            "delivered",
            "returned",
            "cancel",
            "weight",
            "invoice",
          ] as ShipmentOperation[]
        ).map((operation) => ({
          title: t(`OPERATION_${operation.toUpperCase()}`),
          conditions: [{ id: `actionAccess.${operation}`, equalsTo: true }],
          onActionClick: (row: ShipmentTableRow) =>
            handlers.onOperation?.(row, operation),
        })),
        {
          title: t("GENERATE_RETURN_SHIPMENT"),
          link: true,
          linkGetter: (row) =>
            `${shipmentPath(carrier, type, "new")}?returnFrom=${row.id}`,
          conditions: [{ id: "actionAccess.returnShipment", equalsTo: true }],
        },
      ],
    },
  ];
}
