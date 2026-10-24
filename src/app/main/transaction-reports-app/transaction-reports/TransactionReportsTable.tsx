import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useParams } from "react-router-dom";
import { Alert, Button } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import {
  availableTransactionBalances,
  transactionDatesValid,
  safeTransactionUrl,
} from "../../transactions-app/Utils";
import transactionFields from "../../transactions-app/shared-components/TransactionFields";
import {
  GetTransactionReportsApiArg,
  useGetTransactionReportsQuery,
  useLazyGetTransactionReportFileQuery,
} from "../TransactionReportsApi";
import { downloadTransactionReport } from "../Utils";
import {
  newTransactionReportsInstance,
  resetTransactionReports,
  selectTransactionReportsFilters,
  setTransactionReportsPage,
  setTransactionReportsPageSize,
} from "../store/transactionReportsSlice";
export default function TransactionReportsTable() {
  const { t } = useTranslation("transactionReportsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    { userId = "all" } = useParams();
  const filters = useSelector(
      selectTransactionReportsFilters,
    ) as GetTransactionReportsApiArg,
    allowed = availableTransactionBalances(user),
    [ready, setReady] = useState<string>();
  const [downloading, setDownloading] = useState<string>(),
    [exportError, setExportError] = useState(false),
    busy = useRef(false),
    key = `${userId}/${user.id}/${user.role}`;
  useEffect(() => {
    dispatch(
      newTransactionReportsInstance({
        userIdFilter: user.role === "user" ? "all" : userId,
        relatedBalanceTypeFilter: allowed[0],
      }),
    );
    setReady(key);
    setExportError(false);
  }, [dispatch, key, allowed.join(",")]);
  useEffect(
    () => () => {
      dispatch(resetTransactionReports(null));
    },
    [dispatch],
  );
  const scoped = {
    ...filters,
    userIdFilter: user.role === "user" ? "all" : filters.userIdFilter,
  };
  const valid = transactionDatesValid(filters),
    authorized = allowed.includes(filters.relatedBalanceTypeFilter as "wallet"),
    accountSelected =
      user.role === "user" ||
      (!!filters.userIdFilter && filters.userIdFilter !== "all");
  const { data, currentData, isFetching, isError, refetch } =
    useGetTransactionReportsQuery(scoped, {
      skip:
        !allowed.length ||
        !authorized ||
        !valid ||
        !accountSelected ||
        ready !== key,
      refetchOnMountOrArgChange: true,
    });
  const [getFile] = useLazyGetTransactionReportFileQuery();
  useEffect(() => {
    if (
      currentData &&
      !isFetching &&
      filters.page > 0 &&
      filters.page >
        Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setTransactionReportsPage(
          Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1),
        ),
      );
  }, [currentData, isFetching, filters.page, filters.pageSize, dispatch]);
  async function download(reportType: "pdf" | "xlsx") {
    if (
      busy.current ||
      !valid ||
      !authorized ||
      !accountSelected ||
      ready !== key
    )
      return;
    const snapshot = { ...scoped },
      owner = user.role === "user" ? user.id : snapshot.userIdFilter;
    busy.current = true;
    setDownloading(reportType);
    setExportError(false);
    try {
      const value = await getFile({ ...snapshot, reportType }, false).unwrap();
      const url = safeTransactionUrl(value?.url);
      if (!url) throw new Error("Missing report URL");
      await downloadTransactionReport(
        url,
        `Ashamco-transactions-${owner}.${reportType}`,
      );
    } catch {
      setExportError(true);
    } finally {
      busy.current = false;
      setDownloading(undefined);
    }
  }
  const visible = accountSelected && authorized && valid && ready === key;
  const fields = transactionFields(
    t,
    user,
    filters.relatedBalanceTypeFilter,
    "report",
  );
  if (!allowed.length) return <Navigate to="/home" replace />;
  return (
    <div
      className="w-full flex flex-col h-full"
      data-testid="transaction-reports-table"
    >
      {!accountSelected && (
        <Alert severity="info">{t("SELECT_MERCHANT_FOR_REPORT")}</Alert>
      )}
      {!valid && <Alert severity="error">{t("INVALID_DATE_RANGE")}</Alert>}
      {isError && visible && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      {exportError && (
        <Alert severity="error">{t("REPORT_DOWNLOAD_ERROR")}</Alert>
      )}
      {visible && (
        <div className="flex flex-wrap gap-8 p-16">
          {(["pdf", "xlsx"] as const).map((type) => (
            <LoadingButton
              key={type}
              variant="contained"
              color={type === "pdf" ? "error" : "success"}
              loading={downloading === type}
              disabled={!!downloading}
              data-testid={`download-report-${type}`}
              onClick={() => download(type)}
            >
              {t(type === "pdf" ? "EXPORT_AS_PDF" : "EXPORT_AS_EXCEL")}
            </LoadingButton>
          ))}
        </div>
      )}
      <CustomTable
        fields={fields}
        data={
          visible
            ? currentData?.results || (isFetching ? data?.results : []) || []
            : []
        }
        total={visible ? data?.total || 0 : 0}
        page={filters.page}
        pageSize={filters.pageSize}
        status={
          visible && isError
            ? FetchStatus.error
            : (visible && isFetching) || ready !== key
              ? FetchStatus.loading
              : FetchStatus.done
        }
        error={visible && isError ? t("LOAD_ERROR") : undefined}
        autoRowHeight
        estimatedRowHeight={140}
        checkboxSelection
        exportedFileName="Ashamco Transaction Reports"
        noDataMessage={t("NO_TRANSACTIONS")}
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setTransactionReportsPageSize(pageSize));
          else dispatch(setTransactionReportsPage(page));
        }}
      />
    </div>
  );
}
