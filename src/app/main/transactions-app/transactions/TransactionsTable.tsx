import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import {
  GetTransactionsApiArg,
  useGetTransactionsQuery,
  useLazyGetTransactionsQuery,
} from "../TransactionsApi";
import {
  availableTransactionBalances,
  canUseTransactionBalance,
  transactionDatesValid,
} from "../Utils";
import transactionFields from "../shared-components/TransactionFields";
import {
  newTransactionsInstance,
  resetTransactions,
  selectTransactionsFilters,
  setTransactionsPage,
  setTransactionsPageSize,
} from "../store/transactionsSlice";
export default function TransactionsTable({
  fixedUserId,
  fixedBalance,
}: { fixedUserId?: string; fixedBalance?: string } = {}) {
  const { t } = useTranslation("transactionsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    location = useLocation();
  const {
      userId = fixedUserId || "all",
      relatedBalance = fixedBalance || "wallet",
    } = useParams(),
    filters = useSelector(selectTransactionsFilters) as GetTransactionsApiArg;
  const [ready, setReady] = useState<string>();
  const key = `${userId}/${relatedBalance}/${user.id}/${user.role}/${location.search}`;
  const allowed = availableTransactionBalances(user),
    canView = allowed.length > 0;
  useEffect(() => {
    dispatch(
      newTransactionsInstance({
        userIdFilter: user.role === "user" ? "all" : userId,
        relatedBalanceTypeFilter:
          relatedBalance === "all" && allowed.length === 2
            ? "all"
            : allowed.includes(relatedBalance as "wallet")
              ? relatedBalance
              : allowed[0],
        createdByIdFilter:
          user.role === "admin"
            ? new URLSearchParams(location.search).get("createdById") || ""
            : "",
      }),
    );
    setReady(key);
  }, [dispatch, key, allowed.join(",")]);
  useEffect(
    () => () => {
      dispatch(resetTransactions(null));
    },
    [dispatch],
  );
  const scoped = {
    ...filters,
    ...(fixedBalance ? { relatedBalanceTypeFilter: fixedBalance } : {}),
    userIdFilter:
      user.role === "user" ? "all" : fixedUserId || filters.userIdFilter,
    createdByIdFilter: user.role === "admin" ? filters.createdByIdFilter : "",
  };
  const authorizedBalance =
    filters.relatedBalanceTypeFilter === "all"
      ? allowed.length === 2
      : canUseTransactionBalance(user, filters.relatedBalanceTypeFilter);
  const validDates = transactionDatesValid(filters);
  const { data, currentData, isFetching, isError, refetch } =
    useGetTransactionsQuery(scoped, {
      skip: !canView || !authorizedBalance || !validDates || ready !== key,
      refetchOnMountOrArgChange: true,
    });
  const [getAll] = useLazyGetTransactionsQuery();
  useEffect(() => {
    if (
      currentData &&
      !isFetching &&
      filters.page > 0 &&
      filters.page >
        Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setTransactionsPage(
          Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1),
        ),
      );
  }, [currentData, isFetching, filters.page, filters.pageSize, dispatch]);
  const fields = transactionFields(t, user, filters.relatedBalanceTypeFilter);
  if (!canView) return <Navigate to="/home" replace />;
  return (
    <div
      className="w-full flex flex-col h-full"
      data-testid="transactions-table"
    >
      {isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      {!validDates && <Alert severity="error">{t("INVALID_DATE_RANGE")}</Alert>}
      <CustomTable
        fields={fields}
        data={
          ready === key && validDates && authorizedBalance
            ? data?.results || []
            : []
        }
        total={data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        status={
          isError
            ? FetchStatus.error
            : isFetching || ready !== key
              ? FetchStatus.loading
              : FetchStatus.done
        }
        error={isError ? t("LOAD_ERROR") : undefined}
        noDataMessage={t("NO_TRANSACTIONS")}
        autoRowHeight
        estimatedRowHeight={140}
        checkboxSelection
        exportedFileName="Ashamco Express Transactions"
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setTransactionsPageSize(pageSize));
          else dispatch(setTransactionsPage(page));
        }}
        tableToolbarSelectionExportAllButton={
          user.role !== "user" &&
          validDates &&
          authorizedBalance &&
          ready === key
        }
        tableToolbarSelectionExportAllButtonProps={{
          onClick: async () => {
            const response = await getAll({
              ...scoped,
              page: 0,
              pageSize: 50000,
            }).unwrap();
            return { data: response.results, fields };
          },
        }}
      />
    </div>
  );
}
