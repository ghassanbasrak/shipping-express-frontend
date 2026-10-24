import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button } from "@mui/material";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import AlertDialog from "app/shared-components/alert-dialog/AlertDialog";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import IAlert from "../models/IAlert";
import {
  GetAlertsApiArg,
  useGetAlertsQuery,
  useRemoveAlertMutation,
} from "../AlertsApi";
import {
  toAlertTypeTitle,
  toAlertTypeColor,
  toAlertViewTypeTitle,
  toAlertViewTypeColor,
} from "../Utils";
import {
  newAlertsInstance,
  resetAlerts,
  selectAlertsFilters,
  setAlertsPage,
  setAlertsPageSize,
} from "../store/alertsSlice";

export default function AlertsTable() {
  const { t } = useTranslation("alertsApp"),
    dispatch = useAppDispatch(),
    navigate = useNavigate(),
    user = useAppSelector(selectUser);
  const routeKey = "alerts";
  const filters = useSelector(selectAlertsFilters) as GetAlertsApiArg;
  const [ready, setReady] = useState<string>();
  const canView = hasOperationPermission("alerts", "view", user);
  useEffect(() => {
    dispatch(newAlertsInstance(null));
    setReady(routeKey);
  }, [dispatch, routeKey]);
  useEffect(
    () => () => {
      dispatch(resetAlerts(null));
    },
    [dispatch],
  );
  const { data, isFetching, isError, refetch } = useGetAlertsQuery(filters, {
    skip: ready !== routeKey || !canView,
    refetchOnMountOrArgChange: true,
  });
  const [removeAlert] = useRemoveAlertMutation();
  function handleAction(row: IAlert) {
    if (!hasOperationPermission("alerts", "delete", user)) return;
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t("REMOVE_ALERT_TITLE")}
            message={t("REMOVE_ALERT_MESSAGE")}
            onSubmit={async () => {
              try {
                await removeAlert(row.id).unwrap();
                dispatch(
                  showMessage({
                    message: t("ALERT_REMOVED_SUCCESSFULLY"),
                    variant: "success",
                  }),
                );
              } catch {
                dispatch(
                  showMessage({
                    message: t("SOMETHING_WENT_WRONG_WHEN_REMOVE_ALERT"),
                    variant: "error",
                  }),
                );
              }
            }}
          />
        ),
      }),
    );
  }
  const fields: TableFieldProps<IAlert>[] = [
    {
      id: "imageUrl",
      label: t("IMAGE"),
      type: TableDataTypes.image,
      flex: 0.8,
      minWidth: 80,
    },
    {
      id: "type",
      label: t("TYPE"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toAlertTypeTitle(value)),
      toChipColor: toAlertTypeColor,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "viewType",
      label: t("VIEW_TYPE"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toAlertViewTypeTitle(value)),
      toChipColor: toAlertViewTypeColor,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "title",
      label: t("TITLE"),
      type: TableDataTypes.normal,
      flex: 1,
      minWidth: 100,
    },
    {
      id: "content",
      label: t("CONTENT"),
      type: TableDataTypes.normal,
      flex: 1.2,
      minWidth: 120,
      className: "line-clamp-2",
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
      type: TableDataTypes.actions,
      flex: 1.2,
      minWidth: 120,
      actions: [
        {
          title: t("VIEW"),
          color: "secondary",
          onActionClick: (row) => navigate(`/alerts/${row.id}`),
        },
        ...(hasOperationPermission("alerts", "delete", user)
          ? [
              {
                title: t("REMOVE"),
                color: "error" as const,
                onActionClick: handleAction,
              },
            ]
          : []),
      ],
    },
  ];
  if (!canView) return <Navigate to="/home" replace />;
  return (
    <div className="w-full flex flex-col h-full">
      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<IAlert>
        fields={fields}
        data={data?.results || []}
        total={data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        status={
          isError
            ? FetchStatus.error
            : ready !== routeKey || isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        error={isError ? t("LOAD_ERROR") : undefined}
        noDataMessage={t("NO_ALERTS")}
        autoRowHeight
        estimatedRowHeight={100}
        checkboxSelection
        exportedFileName="Ashamco Express - Alerts"
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setAlertsPageSize(pageSize));
          else dispatch(setAlertsPage(page));
        }}
      />
    </div>
  );
}
