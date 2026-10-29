import { hasOperationPermission as merchantProfilePermission } from "src/app/auth/permissions";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { FetchStatus } from "../../utils/dataStatus";
import ILog from "../models/ILog";
import { GetLogsApiArg, useGetLogsQuery } from "../LogsApi";
import {
  canViewLogs,
  logSnapshots,
  logShipmentPath,
  toLogsTypeTitle,
  toLogsTypeColor,
  invalidLogDates,
} from "../Utils";
import {
  selectLogsFilters,
  newLogsInstance,
  resetLogs,
  setLogsPage,
  setLogsPageSize,
} from "../store/logsSlice";
import LogJson from "../shared-components/LogJson";
export default function LogsTable() {
  const { t } = useTranslation("logsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    navigate = useNavigate(),
    filters = useSelector(selectLogsFilters) as GetLogsApiArg;
  const [ready, setReady] = useState(false),
    [raw, setRaw] = useState<ILog>();
  useEffect(() => {
    dispatch(newLogsInstance(null));
    setReady(true);
    return () => {
      dispatch(resetLogs(null));
    };
  }, [dispatch]);
  const permitted = canViewLogs(user),
    invalidDates = invalidLogDates(filters),
    query = useGetLogsQuery(filters, {
      skip: !permitted || !ready || invalidDates,
      refetchOnMountOrArgChange: true,
    });
  useEffect(() => {
    if (
      query.currentData &&
      !query.isFetching &&
      filters.page >
        Math.max(0, Math.ceil(query.currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setLogsPage(
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
      query.data?.results.map((log) =>
        log.id ? log : { ...log, id: log._id },
      ) || [],
    [query.data],
  );
  const fields: TableFieldProps<ILog>[] = [
    {
      id: "message",
      label: t("MESSAGE"),
      type: TableDataTypes.normal,
      flex: 1.3,
      minWidth: 130,
    },
    {
      id: "meta.user.firstName",
      link: merchantProfilePermission("merchants", "view", user),
      linkGetter: (row) =>
        row.meta?.userId || row.meta?.user?.id
          ? `/merchants/${encodeURIComponent(row.meta?.userId || row.meta?.user?.id)}/view`
          : "/merchants",
      label: t("MERCHANT"),
      type: TableDataTypes.normal,
      valueGetter: (row) =>
        `${row.meta?.user?.firstName || ""} ${row.meta?.user?.lastName || ""}`.trim() ||
        row.meta?.userId ||
        "",
      flex: 1.1,
      minWidth: 110,
    },
    {
      id: "modelName",
      label: t("MODEL_NAME"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toLogsTypeTitle(value)),
      toChipColor: toLogsTypeColor,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "context",
      label: t("CONTEXT"),
      type: TableDataTypes.normal,
      flex: 1,
      minWidth: 100,
    },
    {
      id: "meta.data.trackingNumber",
      label: t("SHIPMENT_TRACKING_NUMBER"),
      type: TableDataTypes.normal,
      valueGetter: (row) =>
        logSnapshots(row)[0]?.trackingNumber ||
        t("NO_SHIPMENT_TRACKING_NUMBER"),
      flex: 0.9,
      minWidth: 90,
    },
    {
      id: "meta.data.reference",
      label: t("TRANSACTION_REFERENCE"),
      type: TableDataTypes.normal,
      valueGetter: (row) =>
        logSnapshots(row)[0]?.reference || t("NO_REFERENCE"),
      flex: 0.7,
      minWidth: 70,
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
      flex: 1.2,
      minWidth: 120,
      exportable: false,
      renderCell: ({ row }) => (
        <div className="flex flex-wrap gap-4 py-8">
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={() =>
              setRaw(
                query.data?.results.find(
                  (log) => (log.id || log._id) === row.id,
                ) || row,
              )
            }
          >
            {t("VIEW")}
          </Button>
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={() =>
              navigate(`/logs/${encodeURIComponent(row.id || row._id)}`)
            }
          >
            {t("DETAILS")}
          </Button>
          {logShipmentPath(row) &&
            hasOperationPermission("shipments", "view", user) && (
              <Button
                color="primary"
                variant="outlined"
                size="small"
                onClick={() => navigate(logShipmentPath(row))}
              >
                {t("VIEW_SHIPMENT")}
              </Button>
            )}
          {logSnapshots(row)[0]?.reference &&
            hasOperationPermission("transactions", "view", user) && (
              <Button
                color="primary"
                variant="outlined"
                size="small"
                onClick={() => navigate("/transactions/all/wallet")}
              >
                {t("VIEW_TRANSACTION")}
              </Button>
            )}
          {logSnapshots(row)[0]?.reference &&
            hasOperationPermission("payments", "view", user) && (
              <Button
                color="primary"
                variant="outlined"
                size="small"
                onClick={() => navigate("/topup-requests/all")}
              >
                {t("VIEW_PAYMENT")}
              </Button>
            )}
        </div>
      ),
    },
  ];
  if (!permitted) return <Navigate to="/home" replace />;
  return (
    <div className="w-full flex flex-col h-full" data-testid="logs-table">
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
      <CustomTable<ILog>
        fields={fields}
        data={rows}
        total={query.data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        status={
          query.isError || invalidDates
            ? FetchStatus.error
            : !ready || query.isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        noDataMessage={t("NO_LOGS")}
        autoRowHeight
        estimatedRowHeight={130}
        checkboxSelection
        exportedFileName="Ashamco - Logs"
        onChangePagination={({ page, pageSize }) =>
          pageSize !== filters.pageSize
            ? dispatch(setLogsPageSize(pageSize))
            : dispatch(setLogsPage(page))
        }
      />
      <Dialog
        open={!!raw}
        fullWidth
        maxWidth="md"
        onClose={() => setRaw(undefined)}
        aria-labelledby="log-json-title"
      >
        <DialogTitle id="log-json-title">{t("LOG")}</DialogTitle>
        <DialogContent>{raw && <LogJson log={raw} />}</DialogContent>
        <DialogActions>
          <Button
            color="primary"
            variant="outlined"
            onClick={() => setRaw(undefined)}
          >
            {t("CLOSE")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
