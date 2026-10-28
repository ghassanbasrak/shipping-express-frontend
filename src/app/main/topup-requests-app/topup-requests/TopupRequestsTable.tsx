import { hasOperationPermission as merchantProfilePermission } from "src/app/auth/permissions";
import Currency from "../../utils/currencyFormatter";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, Chip, Typography } from "@mui/material";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { FetchStatus } from "../../utils/dataStatus";
import ITopupRequest from "../models/ITopupRequest";
import {
  GetTopupRequestsApiArg,
  useGetTopupRequestsQuery,
  useLazyGetTopupRequestsQuery,
} from "../TopupRequestsApi";
import {
  canViewTopupRequests,
  invalidTopupDates,
  toTopupRequestStatusTitle,
  toTopupRequestStatusColor,
  topupRequestEntityTypes,
  toTopupRequestEntityTypeImage,
  toTopupRequestEntityTypeTitle,
  getPayTabsResultCodeError,
  getHyperpayResultCodeError,
  topupRequestStatus,
} from "../Utils";
import {
  selectTopupRequestsFilters,
  newTopupRequestsInstance,
  resetTopupRequests,
  setTopupRequestsPage,
  setTopupRequestsPageSize,
} from "../store/topupRequestsSlice";
import RecreateCheckoutButton from "../shared-components/RecreateCheckoutButton";
export default function TopupRequestsTable() {
  const { t, i18n } = useTranslation("topupRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    { userId = "all" } = useParams(),
    filters = useSelector(selectTopupRequestsFilters) as GetTopupRequestsApiArg,
    routeKey = `${userId}/${user.role}`;
  const [ready, setReady] = useState<string>();
  useEffect(() => {
    dispatch(
      newTopupRequestsInstance({
        userIdFilter: user.role === "user" ? "all" : userId,
      }),
    );
    setReady(routeKey);
  }, [dispatch, routeKey]);
  useEffect(
    () => () => {
      dispatch(resetTopupRequests(null));
    },
    [dispatch],
  );
  const permitted = canViewTopupRequests(user),
    invalidDates = invalidTopupDates(filters),
    query = useGetTopupRequestsQuery(filters, {
      skip: !permitted || invalidDates || ready !== routeKey,
      refetchOnMountOrArgChange: true,
    }),
    [getAll] = useLazyGetTopupRequestsQuery();
  useEffect(() => {
    if (
      query.currentData &&
      !query.isFetching &&
      filters.page >
        Math.max(0, Math.ceil(query.currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setTopupRequestsPage(
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
  const details = (row: ITopupRequest) =>
    `${row.transactionId || t("NOT_EXIST_TRANSACTION_ID")}${row.status !== topupRequestStatus.confirmed && (row.reference || row.code || row.responseStatus) ? ` / ${row.code || row.responseStatus ? getPayTabsResultCodeError(row.responseStatus, String(row.code), row.responseMessage, i18n.language) : getHyperpayResultCodeError(row.reference, i18n.language)}` : ""}${row.notes ? ` / ${t("TRANSACTION_NOTES")}: ${row.notes}` : ""}`;
  const fields: TableFieldProps<ITopupRequest>[] = [
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
            valueGetter: (row: ITopupRequest) =>
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
      id: "paymentMethodType",
      label: t("PAYMENT_METHOD"),
      type: TableDataTypes.image,
      flex: 0.5,
      minWidth: 50,
      renderCell: ({ row }) =>
        Object.values(topupRequestEntityTypes).includes(
          row.paymentMethodType,
        ) ? (
          <img
            className="max-h-32 max-w-full object-contain"
            src={`/assets/images/payment-methods/${toTopupRequestEntityTypeImage(row.paymentMethodType)}`}
            alt={t(toTopupRequestEntityTypeTitle(row.paymentMethodType))}
          />
        ) : (
          <span>—</span>
        ),
      valueGetter: (row) =>
        Object.values(topupRequestEntityTypes).includes(row.paymentMethodType)
          ? `/assets/images/payment-methods/${toTopupRequestEntityTypeImage(row.paymentMethodType)}`
          : "",
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
          {row.isPlan && (row.paymentPlan?.name || row.plan?.name) && (
            <Chip
              size="small"
              color="secondary"
              label={row.paymentPlan?.name || row.plan?.name}
            />
          )}
        </div>
      ),
    },
    {
      id: "status",
      label: t("STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toTopupRequestStatusTitle(value)),
      toChipColor: toTopupRequestStatusColor,
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
            type: TableDataTypes.normal,
            flex: 1.2,
            minWidth: 120,
            exportable: false,
            renderCell: ({ row }) => (
              <div className="py-8">
                <Button
                  component={Link}
                  to={`/topup-requests/all/${row.id}`}
                  size="small"
                >
                  {t("DETAILS")}
                </Button>
                <RecreateCheckoutButton payment={row} />
              </div>
            ),
          },
        ]
      : []),
  ];
  if (!permitted) return <Navigate to="/home" replace />;
  return (
    <div
      className="w-full flex flex-col h-full"
      data-testid="topup-requests-table"
    >
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
      <CustomTable<ITopupRequest>
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
        noDataMessage={t("NO_TOPUP_REQUESTS")}
        autoRowHeight
        estimatedRowHeight={130}
        checkboxSelection
        exportedFileName="Ashamco - Topups"
        onChangePagination={({ page, pageSize }) =>
          pageSize !== filters.pageSize
            ? dispatch(setTopupRequestsPageSize(pageSize))
            : dispatch(setTopupRequestsPage(page))
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
