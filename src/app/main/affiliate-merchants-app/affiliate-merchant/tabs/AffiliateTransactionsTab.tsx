import { useEffect, useState } from "react";
import { Alert, Button, Input, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { FetchStatus } from "../../../utils/dataStatus";
import Currency from "../../../utils/currencyFormatter";
import { useSyncShipmentTrackingMutation } from "../../../shipments-app/ShipmentsApi";
import { useGetAffiliateWithdrawBalanceQuery } from "../../../affiliate-withdraw-requests-app/AffiliateWithdrawRequestsApi";
import {
  useGetAffiliateTransactionsQuery,
  useLazyGetAffiliateTransactionsQuery,
  GetAffiliateTransactionsApiArg,
} from "../../AffiliateMerchantsApi";
import IAffiliateTransaction from "../../models/IAffiliateTransaction";
import {
  canViewAffiliateTransactions,
  toAffiliateTransactionStatusColor,
  toAffiliateTransactionStatusTitle,
} from "../../Utils";
export default function AffiliateTransactionsTab({
  affiliateId,
}: {
  affiliateId: string;
}) {
  const { t } = useTranslation(["affiliateMerchantsApp", "transactionsApp"]),
    user = useAppSelector(selectUser),
    [filters, setFilters] = useState({
      page: 0,
      pageSize: 10,
      searchText: "",
      dateFromFilter: "",
      dateToFilter: "",
      createdByIdFilter: "",
    }),
    [invalid, setInvalid] = useState({
      dateFromFilter: false,
      dateToFilter: false,
    }),
    [syncError, setSyncError] = useState(false),
    [syncing, setSyncing] = useState<string>(),
    invalidDates =
      invalid.dateFromFilter ||
      invalid.dateToFilter ||
      !!(
        filters.dateFromFilter &&
        filters.dateToFilter &&
        filters.dateFromFilter > filters.dateToFilter
      ),
    allowed = canViewAffiliateTransactions(user),
    args: GetAffiliateTransactionsApiArg = {
      ...filters,
      userId: affiliateId,
      ...(user.role === "admin" ? {} : { createdByIdFilter: undefined }),
    },
    query = useGetAffiliateTransactionsQuery(args, {
      skip: !allowed || invalidDates,
      refetchOnMountOrArgChange: true,
    }),
    [getAll] = useLazyGetAffiliateTransactionsQuery(),
    balance = useGetAffiliateWithdrawBalanceQuery(affiliateId, {
      skip: !allowed,
      refetchOnMountOrArgChange: true,
    }),
    [sync] = useSyncShipmentTrackingMutation();
  useEffect(() => {
    if (
      query.currentData &&
      !query.isFetching &&
      filters.page >
        Math.max(0, Math.ceil(query.currentData.total / filters.pageSize) - 1)
    )
      setFilters((f) => ({
        ...f,
        page: Math.max(0, Math.ceil(query.currentData.total / f.pageSize) - 1),
      }));
  }, [query.currentData, query.isFetching, filters.page, filters.pageSize]);
  const changeDate = (
    key: "dateFromFilter" | "dateToFilter",
    input: unknown,
  ) => {
    const date = input ? new Date(input as string) : null,
      bad = !!date && !Number.isFinite(date.getTime());
    setInvalid((s) => ({ ...s, [key]: bad }));
    if (!bad)
      setFilters((f) => ({
        ...f,
        [key]: date ? date.toISOString() : "",
        page: 0,
      }));
  };
  const statement = (row: IAffiliateTransaction) =>
    `${row.type === "deposit" ? `${t("SHIPMENT_CREATED_FROM_CUSTOMER_1", { ns: "transactionsApp", customer: `${row.shipment?.user?.firstName || ""} ${row.shipment?.user?.lastName || ""}`.trim() })} ${Currency(row.amount || 0)}. ${t(row.status === "success" ? "SHIPMENT_CREATED_FROM_CUSTOMER_3" : "SHIPMENT_CREATED_FROM_CUSTOMER_2", { ns: "transactionsApp" })}` : row.type === "withdraw" ? `${t("WITHDRAW_REQUEST_CREATED_1", { ns: "transactionsApp" })} ${Currency(row.amount || 0)}. ${t(row.status === "rejected" ? "WITHDRAW_REQUEST_CREATED_4" : row.status === "success" ? "WITHDRAW_REQUEST_CREATED_3" : "WITHDRAW_REQUEST_CREATED_2", { ns: "transactionsApp" })}` : row.description || ""}${row.notes ? ` / ${t("TRANSACTION_NOTES", { ns: "transactionsApp" })}: ${row.notes}` : ""}`;
  const fields: TableFieldProps<IAffiliateTransaction>[] = [
    {
      id: "description",
      label: t("STATEMENT", { ns: "transactionsApp" }),
      type: TableDataTypes.normal,
      valueGetter: statement,
      flex: 1.3,
      minWidth: 130,
    },
    {
      id: "shipment",
      label: t("SHIPMENT", { ns: "transactionsApp" }),
      type: TableDataTypes.normal,
      valueGetter: (row) =>
        row.shipment?.trackingNumber ||
        t("NO_WAYBILL", { ns: "transactionsApp" }),
      renderCell: ({ row }) => (
        <div className="py-8 whitespace-normal">
          {row.shipment?.id &&
          hasOperationPermission("shipments", "view", user) ? (
            <Link to={`/shipments/all/all/${row.shipment.id}/view`}>
              {row.shipment.trackingNumber ||
                t("NO_WAYBILL", { ns: "transactionsApp" })}
            </Link>
          ) : (
            row.shipment?.trackingNumber || "—"
          )}
          {row.shipment?.trackingText && (
            <Typography className="text-12">
              {row.shipment.trackingText}
            </Typography>
          )}
        </div>
      ),
      flex: 0.9,
      minWidth: 90,
    },
    {
      id: "amount",
      label: t("AMOUNT", { ns: "transactionsApp" }),
      type: TableDataTypes.money,
      valueGetter: (row) =>
        row.type === "withdraw" ? -(row.amount || 0) : row.amount || 0,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "status",
      label: t("STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toAffiliateTransactionStatusTitle(value)),
      toChipColor: toAffiliateTransactionStatusColor,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "createdAt",
      label: t("CREATED_AT"),
      type: TableDataTypes.date,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "actions",
      label: t("ACTIONS"),
      type: TableDataTypes.normal,
      flex: 1.1,
      minWidth: 110,
      exportable: false,
      renderCell: ({ row }) =>
        row.shipment?.id &&
        row.shipment.status !== "failed" &&
        ["aramex", "smsa", "smsacold"].includes(
          row.shipment.shippingCompany?.serviceName,
        ) ? (
          <Button
            disabled={!!syncing}
            data-testid={`sync-affiliate-${row.id || row._id}`}
            onClick={async () => {
              if (syncing) return;
              setSyncing(row.shipment.id);
              setSyncError(false);
              try {
                await sync(row.shipment.id).unwrap();
                await query.refetch().unwrap();
              } catch {
                setSyncError(true);
              } finally {
                setSyncing(undefined);
              }
            }}
          >
            {t(syncing === row.shipment.id ? "LOADING" : "SYNC_TRACKING")}
          </Button>
        ) : null,
    },
  ];
  return (
    <div className="space-y-16" data-testid="affiliate-transactions">
      <div className="flex flex-wrap items-center justify-between gap-12">
        <Typography className="text-24 font-bold">
          {t("TRANSACTIONS")}
        </Typography>
        <Paper className="px-16 py-8">
          <Input
            value={filters.searchText}
            placeholder={t("SEARCH_TRANSACTIONS", { ns: "transactionsApp" })}
            onChange={(e) =>
              setFilters((f) => ({ ...f, page: 0, searchText: e.target.value }))
            }
            inputProps={{ "data-testid": "affiliate-transactions-search" }}
            disableUnderline
          />
        </Paper>
        <FilterIcon
          componentProps={{ "data-testid": "affiliate-transactions-filters" }}
          filters={[
            ...(user.role === "admin"
              ? [
                  {
                    type: FilterTypes.autocomplete as const,
                    title: t("CREATED_BY", { ns: "transactionsApp" }),
                    value: filters.createdByIdFilter || null,
                    onChange: (value) =>
                      setFilters((f) => ({
                        ...f,
                        page: 0,
                        createdByIdFilter: value || "",
                      })),
                    getItemUrl: "v1/users",
                    getItemsUrl: "v1/users?role=admin&role=employee",
                    getOptionLabel: (o) =>
                      `${o?.firstName || ""} ${o?.lastName || ""} ${o?.email || ""}`.trim(),
                    closeOnChange: false,
                  },
                ]
              : []),
            ...(["dateFromFilter", "dateToFilter"] as const).map((key) => ({
              type: FilterTypes.dateTime as const,
              title: t(key === "dateFromFilter" ? "START_DATE" : "END_DATE"),
              value: filters[key] ? new Date(filters[key]) : null,
              onChange: (value) => changeDate(key, value),
              disableTime: true,
              closeOnChange: false,
            })),
          ]}
        />
      </div>
      {balance.isError ? (
        <Alert
          severity="error"
          action={
            <Button onClick={() => balance.refetch()}>{t("RETRY")}</Button>
          }
        >
          {t("BALANCE_ERROR")}
        </Alert>
      ) : (
        <Typography data-testid="affiliate-available-balance">
          {t("CURRENT_AFFILIATE_BALANCE")}:{" "}
          {balance.isFetching
            ? "…"
            : Currency(balance.currentData?.balance || 0)}
        </Typography>
      )}
      {invalidDates && (
        <Alert severity="error">{t("INVALID_DATE_RANGE")}</Alert>
      )}
      {syncError && <Alert severity="error">{t("SYNC_ERROR")}</Alert>}
      {query.isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => query.refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<IAffiliateTransaction>
        fields={fields}
        data={(query.data?.results || []).map((row) => ({
          ...row,
          id: row.id || row._id,
        }))}
        total={query.data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        status={
          query.isError || invalidDates
            ? FetchStatus.error
            : query.isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        autoRowHeight
        checkboxSelection
        exportedFileName="Ashamco - Affiliate Ledger"
        onChangePagination={({ page, pageSize }) =>
          setFilters((f) => ({
            ...f,
            page: pageSize !== f.pageSize ? 0 : page,
            pageSize,
          }))
        }
        tableToolbarSelectionExportAllButton={user.role !== "user"}
        tableToolbarSelectionExportAllButtonProps={{
          onClick: async () => {
            if (!allowed || invalidDates)
              throw new Error(t("INVALID_DATE_RANGE"));
            const result = await getAll({
              ...args,
              page: 0,
              pageSize: 50000,
            }).unwrap();
            return { data: result.results, fields };
          },
        }}
      />
    </div>
  );
}
