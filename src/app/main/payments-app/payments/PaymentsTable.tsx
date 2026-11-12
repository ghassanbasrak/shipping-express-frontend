import { hasOperationPermission as merchantProfilePermission } from "src/app/auth/permissions";
import Currency from "../../utils/currencyFormatter";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, Typography } from "@mui/material";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { FetchStatus } from "../../utils/dataStatus";
import IPayment from "../models/IPayment";
import {
  GetPaymentsApiArg,
  useGetPaymentsQuery,
  useLazyGetPaymentsQuery,
} from "../PaymentsApi";
import {
  canViewPayments,
  invalidPaymentDates,
  toPaymentStatusTitle,
  toPaymentStatusColor,
  paymentStatus,
  toPaymentTypeTitle,
  toPaymentTypeColor,
  toPaymentMethodTypeTitle,
  toPaymentMethodTypeColor,
} from "../Utils";
import {
  selectPaymentsFilters,
  newPaymentsInstance,
  resetPayments,
  setPaymentsPage,
  setPaymentsPageSize,
} from "../store/paymentsSlice";
export default function PaymentsTable() {
  const { t } = useTranslation("paymentsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    { userId = "all" } = useParams(),
    filters = useSelector(selectPaymentsFilters) as GetPaymentsApiArg,
    routeKey = `${userId}/${user.role}`;
  const [ready, setReady] = useState<string>();
  useEffect(() => {
    dispatch(
      newPaymentsInstance({
        userIdFilter: user.role === "user" ? "all" : userId,
      }),
    );
    setReady(routeKey);
  }, [dispatch, routeKey]);
  useEffect(
    () => () => {
      dispatch(resetPayments(null));
    },
    [dispatch],
  );
  const permitted = canViewPayments(user),
    invalidDates = invalidPaymentDates(filters),
    query = useGetPaymentsQuery(filters, {
      skip: !permitted || invalidDates || ready !== routeKey,
      refetchOnMountOrArgChange: true,
    }),
    [getAll] = useLazyGetPaymentsQuery();
  useEffect(() => {
    if (
      query.currentData &&
      !query.isFetching &&
      filters.page >
        Math.max(0, Math.ceil(query.currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setPaymentsPage(
          Math.max(
            0,
            Math.ceil(query.currentData.total / filters.pageSize) - 1,
          ),
        ),
      );
  }, [
    query.currentData,
    query.isFetching,
    filters.page,
    filters.pageSize,
    dispatch,
  ]);
  const rows = useMemo(
    () =>
      query.data?.results.map((row) =>
        row.id ? row : { ...row, id: row._id },
      ) || [],
    [query.data],
  );
  const details = (row: IPayment) =>
    `${row.transactionId || t("NOT_EXIST_TRANSACTION_ID")}${row.status !== paymentStatus.confirmed && row.responseMessage ? ` / ${row.responseMessage}` : ""}${row.notes ? ` / ${t("TRANSACTION_NOTES")}: ${row.notes}` : ""}`;
  const fields: TableFieldProps<IPayment>[] = [
    {
      id: "reference",
      label: t("REFERENCE"),
      type: TableDataTypes.normal,
      flex: 0.9,
      minWidth: 90,
      valueGetter: (row) =>
        `${row.code || row.responseStatus ? `${row.responseStatus || ""} - ${row.code || ""}` : row.reference || t("NOT_EXIST")}${user.role !== "user" && row.platform ? ` / ${row.platform}` : ""}`,
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
            flex: 1.1,
            minWidth: 110,
            valueGetter: (row: IPayment) =>
              `${row.user?.firstName || ""} ${row.user?.lastName || ""}`,
          },
          {
            id: "zohoCreditId" as const,
            label: t("QOYOD_ID"),
            type: TableDataTypes.normal,
            flex: 0.6,
            minWidth: 60,
          },
        ]
      : []),
    {
      id: "type",
      label: t("PAYMENT_TYPE"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toPaymentTypeTitle(value)),
      toChipColor: toPaymentTypeColor,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "paymentMethodType",
      label: t("PAYMENT_METHOD"),
      type: TableDataTypes.normal,
      flex: 0.7,
      minWidth: 70,
      chip: true,
      toChipTitle: (value) => t(toPaymentMethodTypeTitle(value)),
      toChipColor: toPaymentMethodTypeColor,
    },
    {
      id: "transactionId",
      label: t("TRANSACTION_ID"),
      type: TableDataTypes.normal,
      flex: 1.3,
      minWidth: 130,
      valueGetter: details,
      renderCell: ({ row }) => (
        <Typography className="py-8 whitespace-pre-wrap break-words" dir="ltr">
          {details(row)}
        </Typography>
      ),
    },
    {
      id: "amount",
      label: t("AMOUNT"),
      type: TableDataTypes.money,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "total",
      label: t("TOTAL_AMOUNT_WITH_TAX"),
      type: TableDataTypes.money,
      flex: 0.7,
      minWidth: 70,
      renderCell: ({ row }) => (
        <div className="py-8 space-y-8">
          <Typography>{Currency(row.total ?? 0)}</Typography>
        </div>
      ),
    },
    {
      id: "status",
      label: t("STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toPaymentStatusTitle(value)),
      toChipColor: toPaymentStatusColor,
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
      id: "updatedAt",
      label: t("UPDATED_AT"),
      type: TableDataTypes.date,
      flex: 0.7,
      minWidth: 70,
    },
    ...(user.role === "user"
      ? [
          {
            id: "actions" as const,
            label: t("ACTIONS"),
            type: TableDataTypes.actions,
            flex: 1.2,
            minWidth: 120,
            exportable: false,
            actions: [
              {
                title: t("DETAILS"),
                color: "secondary" as const,
                link: true,
                linkGetter: (row: IPayment) => `/payments/all/${row.id}`,
              },
            ],
          },
        ]
      : []),
  ];
  if (!permitted) return <Navigate to="/home" replace />;
  return (
    <div className="w-full flex flex-col h-full" data-testid="payments-table">
      {invalidDates && (
        <Alert severity="error">{t("INVALID_DATE_RANGE")}</Alert>
      )}
      {query.isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => query.refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<IPayment>
        fields={fields}
        data={rows}
        total={query.data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        status={
          query.isError || invalidDates
            ? FetchStatus.error
            : ready !== routeKey || query.isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        noDataMessage={t("NO_PAYMENTS")}
        autoRowHeight
        estimatedRowHeight={130}
        checkboxSelection
        exportedFileName="Ashamco - Payments"
        onChangePagination={({ page, pageSize }) =>
          pageSize !== filters.pageSize
            ? dispatch(setPaymentsPageSize(pageSize))
            : dispatch(setPaymentsPage(page))
        }
        tableToolbarSelectionExportAllButton={user.role !== "user"}
        tableToolbarSelectionExportAllButtonProps={{
          onClick: async () => {
            if (invalidDates) throw new Error(t("INVALID_DATE_RANGE"));
            const result = await getAll({
              ...filters,
              page: 0,
              pageSize: 500000,
            }).unwrap();
            return { data: result.results, fields };
          },
        }}
      />
    </div>
  );
}
