import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import IApplication from "../models/IApplication";
import {
  GetApplicationsApiArg,
  useGetApplicationsQuery,
} from "../ApplicationsApi";
import { applicationUserLabel } from "../Utils";
import {
  newApplicationsInstance,
  resetApplications,
  selectApplicationsFilters,
  setApplicationsPage,
  setApplicationsPageSize,
} from "../store/applicationsSlice";
import ApplicationScopesSummary from "../shared-components/ApplicationScopesSummary";
import ApplicationApiDetails from "../shared-components/ApplicationApiDetails";
export default function ApplicationsTable() {
  const { t } = useTranslation("applicationsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const filters = useSelector(
    selectApplicationsFilters,
  ) as GetApplicationsApiArg;
  const [ready, setReady] = useState(false),
    canView =
      user.role !== "user" &&
      hasOperationPermission("applications", "view", user);
  useEffect(() => {
    dispatch(newApplicationsInstance(null));
    setReady(true);
    return () => {
      dispatch(resetApplications(null));
    };
  }, [dispatch]);
  const { data, currentData, isFetching, isError, refetch } =
    useGetApplicationsQuery(filters, {
      skip: !ready || !canView,
      refetchOnMountOrArgChange: true,
    });
  useEffect(() => {
    if (!currentData || isFetching) return;
    const last = Math.max(
      0,
      Math.ceil(currentData.total / filters.pageSize) - 1,
    );
    if (filters.page > last) dispatch(setApplicationsPage(last));
  }, [currentData, isFetching, filters.page, filters.pageSize, dispatch]);
  const fields: TableFieldProps<IApplication>[] = [
    {
      id: "name",
      label: t("NAME"),
      type: TableDataTypes.normal,
      locale: true,
      flex: 1.1,
      minWidth: 110,
    },
    {
      id: "clientName",
      label: t("CLIENT_NAME"),
      type: TableDataTypes.normal,
      flex: 1,
      minWidth: 100,
    },
    {
      id: "userId",
      label: t("MERCHANT"),
      type: TableDataTypes.normal,
      valueGetter: (row) => applicationUserLabel(row.user) || row.userId || "",
      flex: 1.1,
      minWidth: 110,
    },
    {
      id: "scopes",
      label: t("SCOPES"),
      type: TableDataTypes.normal,
      renderCell: (params) => (
        <ApplicationScopesSummary scopes={params.row.scopes} />
      ),
      flex: 1.3,
      minWidth: 130,
    },
    {
      id: "lastUsedAt",
      label: t("LAST_USAGE"),
      type: TableDataTypes.date,
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
      type: TableDataTypes.actions,
      flex: 1.2,
      minWidth: 120,
      actions: [
        {
          title: t("API_KEY"),
          color: "primary",
          keepOnView: true,
          onActionClick: (row) => {
            if (canView)
              dispatch(
                openDialog({
                  maxWidth: "md",
                  fullWidth: true,
                  children: (
                    <ApplicationApiDetails
                      apiKey={row.apiKey}
                      docsPath="/docs"
                    />
                  ),
                }),
              );
          },
          conditions: [{ id: "apiKey" }],
        },
        {
          title: t("VIEW"),
          color: "secondary",
          link: true,
          linkGetter: (row) => `/applications/${row.id}`,
        },
      ],
    },
  ];
  if (!canView) return <Navigate to="/home" replace />;
  return (
    <div
      className="w-full flex flex-col h-full"
      data-testid="applications-table"
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
      <CustomTable<IApplication>
        fields={fields}
        data={data?.results || []}
        total={data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        status={
          isError
            ? FetchStatus.error
            : !ready || isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        error={isError ? t("LOAD_ERROR") : undefined}
        noDataMessage={t("NO_APPLICATIONS")}
        autoRowHeight
        estimatedRowHeight={220}
        checkboxSelection
        exportedFileName="Ashamco Express - Applications"
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setApplicationsPageSize(pageSize));
          else dispatch(setApplicationsPage(page));
        }}
      />
    </div>
  );
}
