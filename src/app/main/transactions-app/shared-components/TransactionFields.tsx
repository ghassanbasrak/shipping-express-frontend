import { TFunction } from "i18next";
import type { User } from "src/app/auth/user";
import {
  TableFieldProps,
  TableDataTypes,
} from "app/shared-components/custom-table/Utils";
import ITransaction from "../models/ITransaction";
import {
  transactionStatement,
  transactionTypes,
  transactionAmountWithTax,
  safeTransactionUrl,
} from "../Utils";
import { displayName } from "../../countries-app/Utils";
export default function transactionFields(
  t: TFunction,
  user: User,
  balance: string,
  context: "ledger" | "report" | "shipment" = "ledger",
): TableFieldProps<ITransaction>[] {
  const staff = user?.role !== "user",
    report = context === "report",
    ledger = context === "ledger";
  const money = (
    id: "amount" | "currentBalance" | "previousBalance",
    label: string,
  ): TableFieldProps<ITransaction> => ({
    id,
    label: t(label),
    type: TableDataTypes.money,
    flex: 0.7,
    minWidth: 70,
    ...(id !== "previousBalance"
      ? {
          moneyChangesColor: true,
          moneyChangesColorGetter: (row: ITransaction) =>
            row.type === transactionTypes.withdraw
              ? ("error" as const)
              : ("success" as const),
          moneyChangesLabel: true,
          moneyChangesLabelGetter: (row: ITransaction) =>
            id === "amount"
              ? row.type === transactionTypes.withdraw
                ? "- "
                : ""
              : row.type === transactionTypes.withdraw
                ? "↓ "
                : "↑ ",
        }
      : {}),
  });
  return [
    {
      id: "reference" as const,
      label: t("TRANSACTION_ID"),
      type: TableDataTypes.normal,
      flex: 0.7,
      minWidth: 70,
    },
    ...(staff && !report
      ? [
          {
            id: "user.firstName" as const,
            label: t("MERCHANT"),
            type: TableDataTypes.normal,
            valueGetter: (row: ITransaction) =>
              [row.user?.firstName, row.user?.lastName]
                .filter(Boolean)
                .join(" "),
            flex: 1.1,
            minWidth: 110,
          },
        ]
      : []),
    ...(user?.role === "admin" && context !== "shipment"
      ? [
          {
            id: "createdBy.firstName" as const,
            label: t("CREATED_BY"),
            type: TableDataTypes.normal,
            valueGetter: (row: ITransaction) =>
              [row.createdBy?.firstName, row.createdBy?.lastName]
                .filter(Boolean)
                .join(" "),
            flex: 1,
            minWidth: 100,
          },
        ]
      : []),
    ...(staff && context !== "shipment"
      ? [
          {
            id: "zohoCreditId" as const,
            label: t("QOYOD_ID"),
            type: TableDataTypes.normal,
            valueGetter: (row: ITransaction) =>
              row.type === transactionTypes.deposit
                ? row.zohoCreditId ?? row.invoice?.zohoInvoiceId
                : row.zohoJournalId ?? "",
            link: true,
            linkGetter: (row: ITransaction) =>
              row.type === transactionTypes.withdraw
                ? safeTransactionUrl(row.invoice?.url)
                : undefined,
            target: "_blank",
            flex: 0.7,
            minWidth: 70,
          },
        ]
      : []),
    ...(report
      ? [
          {
            id: "title" as const,
            label: t("TITLE"),
            type: TableDataTypes.normal,
            valueGetter: (row: ITransaction) => displayName(row.title),
            flex: 1,
            minWidth: 100,
          },
        ]
      : []),
    {
      id: "description" as const,
      label: t("STATEMENT"),
      type: TableDataTypes.normal,
      valueGetter: report
        ? (row) => displayName(row.description)
        : transactionStatement,
      valueFormatter: report
        ? (row) => displayName(row.description)
        : transactionStatement,
      flex: 1.3,
      minWidth: 130,
      ...(!report
        ? {
            renderCell: (params) => (
              <div className="py-8 whitespace-normal break-words">
                <strong>{displayName(params.row.title)}</strong>
                <br />
                {displayName(params.row.description)}
                {params.row.notes && (
                  <>
                    <br />
                    <strong>
                      {t("TRANSACTION_NOTES")}: {params.row.notes}
                    </strong>
                  </>
                )}
              </div>
            ),
          }
        : {}),
    },
    money("previousBalance", "PREVIOUS_BALANCE"),
    ...(ledger && staff && balance === "wallet"
      ? [
          {
            id: "taxable" as const,
            label: t("AMOUNT_WITH_TAX"),
            type: TableDataTypes.money,
            valueGetter: transactionAmountWithTax,
            flex: 0.7,
            minWidth: 70,
          },
        ]
      : []),
    money("amount", "AMOUNT"),
    money("currentBalance", "BALANCE"),
    {
      id: "createdAt" as const,
      label: t("TRANSACTION_CREATED_AT"),
      type: TableDataTypes.date,
      flex: 0.7,
      minWidth: 70,
    },
    ...(report
      ? [
          {
            id: "notes" as const,
            label: t("TRANSACTION_NOTES"),
            type: TableDataTypes.normal,
            flex: 1.2,
            minWidth: 120,
          },
        ]
      : []),
    ...(ledger && balance === "wallet"
      ? [
          {
            id: "actions" as const,
            label: t("ACTIONS"),
            type: TableDataTypes.actions,
            flex: 1.1,
            minWidth: 110,
            actions: [
              {
                title: t("INVOICE"),
                color: "secondary" as const,
                link: true,
                linkGetter: (row: ITransaction) =>
                  safeTransactionUrl(row.invoiceUrl),
                target: "_blank",
                keepOnView: true,
                conditions: [
                  { id: "type" as const, equalsTo: transactionTypes.deposit },
                  { id: "invoiceUrl" as const },
                ],
              },
            ],
          },
        ]
      : []),
  ];
}
