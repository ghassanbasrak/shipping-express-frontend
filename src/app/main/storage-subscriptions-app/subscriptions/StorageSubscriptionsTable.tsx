import { useSelector } from "react-redux";
import { useEffect } from "react";
import { Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppSelector, useAppDispatch } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  type TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { FetchStatus } from "../../utils/dataStatus";
import { useGetStorageSubscriptionsQuery } from "../StorageSubscriptionsApi";
import {
  selectSubscriptionFilters,
  setSubscriptionFilter,
} from "../store/storageSubscriptionsSlice";
import {
  toStorageSubscriptionStatusTitle,
  toStorageSubscriptionStatusColor,
} from "../Utils";
import { toPaymentMethodTypeTitle } from "../../payments-app/Utils";
import { toStorageTypeTitle } from "../../storage-app/Utils";
import type IStorageSubscription from "../models/IStorageSubscription";
export default function StorageSubscriptionsTable() {
  const { t } = useTranslation(["storageApp", "paymentsApp"]),
    user = useAppSelector(selectUser),
    filters = useSelector(selectSubscriptionFilters),
    dispatch = useAppDispatch();
  const query = useGetStorageSubscriptionsQuery(
    { admin: user.role === "admin", userId: user.id },
    { refetchOnMountOrArgChange: true },
  );
  const rows = (query.currentData || []).filter(
    (row) =>
      (user.role === "admin" || row.userId === user.id) &&
      (!filters.status || row.status === filters.status) &&
      [
        row.id,
        row.plan?.name,
        row.user?.companyName,
        row.user?.firstName,
        row.user?.lastName,
        row.paymentId,
      ].some((v) =>
        (v || "").toLowerCase().includes(filters.searchText.toLowerCase()),
      ),
  );
  const field = (
    id: TableFieldProps<IStorageSubscription>["id"],
    label: string,
    flex: number,
    type = TableDataTypes.normal,
  ): TableFieldProps<IStorageSubscription> => ({
    id,
    label: t(label),
    type,
    flex,
    minWidth: flex * 100,
  });
  const fields: TableFieldProps<IStorageSubscription>[] = [
    field("id", "SUBSCRIPTION_NUMBER", 1.1),
    {
      ...field("planId", "PLAN", 1),
      valueGetter: (r) => r.plan?.name || r.planId,
      link: user.role === "admin",
      linkGetter: (r) => "/storage/plans/" + r.planId,
    },
    {
      ...field("status", "STATUS", 0.7),
      chip: true,
      toChipTitle: (v) => t(toStorageSubscriptionStatusTitle(v)),
      toChipColor: toStorageSubscriptionStatusColor,
    },
    field("price", "PRICE", 0.7, TableDataTypes.money),
    field("startsAt", "STARTS_AT", 0.7, TableDataTypes.date),
    field("endsAt", "EXPIRES_AT", 0.7, TableDataTypes.date),
    {
      ...field("paymentId", "PAYMENT", 1.1),
      link: true,
      linkGetter: (r) =>
        `/payments/${user.role === "admin" ? r.userId : "all"}/${r.paymentId}`,
    },
    {
      ...field("payment.paymentMethodType", "PAYMENT_METHOD", 0.7),
      valueGetter: (r) =>
        t(toPaymentMethodTypeTitle(r.payment?.paymentMethodType), {
          ns: "paymentsApp",
        }),
    },
    { ...field("plan.durationDays", "DURATION_DAYS", 0.6) },
    {
      ...field("plan.storageTypes", "STORAGE_TYPES", 1.1),
      valueGetter: (r) =>
        r.plan?.storageTypes?.map((v) => t(toStorageTypeTitle(v))).join(", ") ||
        "—",
    },
    {
      ...field("plan.features", "PLAN_FEATURES", 1.3),
      valueGetter: (r) => r.plan?.features?.join(" · ") || "—",
    },
    field("createdAt", "CREATED_AT", 0.7, TableDataTypes.date),
    field("updatedAt", "UPDATED_AT", 0.7, TableDataTypes.date),
  ];
  if (user.role === "admin")
    fields.splice(1, 0, {
      ...field("userId", "MERCHANT", 1.1),
      valueGetter: (r) =>
        r.user?.companyName ||
        [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ") ||
        r.userId,
      link: true,
      linkGetter: (r) => `/merchants/${r.userId}/view`,
    });
  useEffect(() => {
    if (
      !query.isFetching &&
      !query.isError &&
      filters.page > 0 &&
      filters.page * filters.pageSize >= rows.length
    )
      dispatch(
        setSubscriptionFilter({
          field: "page",
          value: Math.max(0, Math.ceil(rows.length / filters.pageSize) - 1),
        }),
      );
  }, [
    rows.length,
    filters.page,
    filters.pageSize,
    query.isFetching,
    query.isError,
    dispatch,
  ]);
  return (
    <div className="w-full h-full">
      {query.isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => query.refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<IStorageSubscription>
        data={rows.slice(
          filters.page * filters.pageSize,
          (filters.page + 1) * filters.pageSize,
        )}
        fields={fields}
        total={rows.length}
        page={filters.page}
        pageSize={filters.pageSize}
        noDataMessage={t("NO_RESULTS")}
        status={
          query.isError
            ? FetchStatus.error
            : query.isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        onChangePagination={({ page, pageSize }) =>
          dispatch(
            setSubscriptionFilter({
              field: pageSize !== filters.pageSize ? "pageSize" : "page",
              value: pageSize !== filters.pageSize ? pageSize : page,
            }),
          )
        }
      />
    </div>
  );
}
