import { hasOperationPermission as merchantProfilePermission } from "src/app/auth/permissions";
import { Link } from "react-router-dom";
import { Typography } from "@mui/material";
import { TFunction } from "i18next";
import moment from "moment";
import type { User } from "src/app/auth/user";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import IMerchantDue from "../models/IMerchantDue";
import {
  toShipmentStatusTitle,
  toShipmentStatusColor,
  toShipmentPaymentStatusTitle,
  toShipmentPaymentStatusColor,
  canUpdateMerchantDues,
  canSettleMerchantDue,
  canReturnMerchantDue,
} from "../Utils";
import type { ShipmentOperation } from "../../shipments-app/shared-components/ShipmentOperations";
export type MerchantDueTableRow = IMerchantDue & {
  actionAccess: Record<string, boolean>;
};
export const toMerchantDueTableRow = (
  row: IMerchantDue,
  user: User,
): MerchantDueTableRow => ({
  ...row,
  actionAccess: {
    tracking:
      !!row.shipment.trackingUrl &&
      (user.role !== "user" || row.shipment.status !== "failed"),
    settle: canSettleMerchantDue(user, row),
    returned: canReturnMerchantDue(user, row),
    weight: canUpdateMerchantDues(user),
    processing:
      canUpdateMerchantDues(user) &&
      ["canceled", "failed"].includes(row.shipment.status),
  },
});
export default function merchantDueFields(
  t: TFunction,
  user: User,
  onOperation?: (row: IMerchantDue, operation: ShipmentOperation) => void,
): TableFieldProps<MerchantDueTableRow>[] {
  return [
    {
      id: "shipment.trackingNumber",
      label: t("SHIPMENT_REFERENCE"),
      type: TableDataTypes.normal,
      valueGetter: (row) => row.shipment.trackingNumber || t("NO_WAYBILL"),
      flex: 1,
      minWidth: 100,
      renderCell: ({ row }) =>
        user.role !== "user" || row.shipment.status !== "failed" ? (
          <Link
            className="underline"
            to={`/shipments/${row.shipment.shippingCompanyId || "all"}/all/${row.shipmentId}`}
          >
            {row.shipment.trackingNumber || t("NO_WAYBILL")}
          </Link>
        ) : (
          t("NO_WAYBILL")
        ),
    },
    {
      id: "shipment.shippingCompany.name",
      label: t("COMPANY"),
      type: TableDataTypes.normal,
      valueGetter: (row) => row.shipment.shippingCompany?.name,
      flex: 1,
      minWidth: 100,
      renderCell: ({ row }) => (
        <div className="flex flex-col gap-8">
          {row.shipment.shippingCompany?.logoUrl && (
            <img
              className="h-32 max-w-96 object-contain"
              src={row.shipment.shippingCompany.logoUrl}
              alt=""
            />
          )}
          <span>{row.shipment.shippingCompany?.name}</span>
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
            valueGetter: (row: IMerchantDue) =>
              `${row.user?.firstName || ""} ${row.user?.lastName || ""}`,
            flex: 1.1,
            minWidth: 110,
            renderCell: ({ row }) => (
              <div>
                <Typography>
                  {row.user?.firstName} {row.user?.lastName}
                </Typography>
                <Typography className="text-12">
                  {row.shipment.platform}
                </Typography>
              </div>
            ),
          },
        ]
      : []),
    {
      id: "shipment.receiverName",
      label: t("RECEIVER"),
      type: TableDataTypes.normal,
      valueGetter: (row) => row.shipment.receiverName,
      flex: 1.1,
      minWidth: 110,
      renderCell: ({ row }) =>
        row.shipment.receiverId ? (
          <Link
            className="underline"
            to={`/shipment-users/receiver/${row.shipment.receiverId}`}
          >
            {row.shipment.receiverName}
          </Link>
        ) : (
          row.shipment.receiverName
        ),
    },
    {
      id: "shipment.status",
      label: t("SHIPMENT_STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toShipmentStatusTitle(value)),
      toChipColor: (value) => toShipmentStatusColor(value),
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "codPrice",
      label: t("DUE_AMOUNT"),
      type: TableDataTypes.money,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "codStatus",
      label: t("PAYMENT_STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toShipmentPaymentStatusTitle(value)),
      toChipColor: toShipmentPaymentStatusColor,
      infoIconGetter: (row) =>
        row.codStatus === "settled" && !!row.relatedRequestId,
      infoContentGetter: (row) =>
        `${t("REQUEST_REFERENCE")}: ${row.relatedRequestId || ""}`,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "updatedAt",
      label: t("UPDATED_AT"),
      type: TableDataTypes.date,
      valueFormatter: (row) =>
        row.updatedAt ? moment(row.updatedAt).format("DD/MM/YYYY HH:mm") : "--",
      withTime: true,
      flex: 0.7,
      minWidth: 70,
      infoIconGetter: (row) => user.role !== "user" && !!row.updatedBy,
      infoContentGetter: (row) =>
        `${row.updatedBy?.firstName || ""} ${row.updatedBy?.lastName || ""}`,
    },
    {
      id: "actions",
      label: t("ACTIONS"),
      type: TableDataTypes.actions,
      flex: 1.2,
      minWidth: 120,
      exportable: false,
      actions: [
        {
          title: t("TRACK"),
          link: true,
          linkGetter: (row) => row.shipment.trackingUrl,
          target: "_blank",
          conditions: [{ id: "actionAccess.tracking", equalsTo: true }],
        },
        ...(["settle", "returned", "weight"] as ShipmentOperation[]).map(
          (operation) => ({
            title: t(
              operation === "settle"
                ? "SETTLEMENT"
                : operation === "returned"
                  ? "CONVERT_TO_RETURNED"
                  : "DISCOUNT_EXTRA_WEIGHT",
            ),
            conditions: [{ id: `actionAccess.${operation}`, equalsTo: true }],
            onActionClick: (row: MerchantDueTableRow) =>
              onOperation?.(row, operation),
          }),
        ),
        ...["failed", "canceled"].map((status) => ({
          title: t(
            status === "failed"
              ? "REACTIVATE_SHIPMENT"
              : "CONVERT_TO_PROCESSING",
          ),
          conditions: [
            { id: "actionAccess.processing", equalsTo: true },
            { id: "shipment.status", equalsTo: status },
          ],
          onActionClick: (row: MerchantDueTableRow) =>
            onOperation?.(row, "processing"),
        })),
      ],
    },
  ];
}
