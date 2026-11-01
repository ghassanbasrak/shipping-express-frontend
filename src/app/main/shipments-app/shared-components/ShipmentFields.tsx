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
} from "../Utils";
import ShipmentDocuments from "./ShipmentDocuments";
import ShipmentOperations from "./ShipmentOperations";
export default function shipmentFields(
  t: TFunction,
  user: User,
  carrier = "all",
  type = "all",
): TableFieldProps<IShipment>[] {
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
      renderCell: ({ row }) => (
        <div className="flex flex-col gap-4">
          {(user.role !== "user" || row.status !== "failed") && (
            <ButtonLink
              to={shipmentPath(carrier, type, row.id)}
              title={t("VIEW")}
            />
          )}
          <ShipmentDocuments row={row} />
          <ShipmentOperations row={row} />
        </div>
      ),
    },
  ];
}
function ButtonLink({ to, title }: { to: string; title: string }) {
  return (
    <Link to={to} className="underline">
      {title}
    </Link>
  );
}
