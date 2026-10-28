import { hasOperationPermission as merchantProfilePermission } from "src/app/auth/permissions";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button } from "@mui/material";
import { Navigate, useParams, useLocation } from "react-router-dom";
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
import IAuthRequest from "../models/IAuthRequest";
import {
  GetAuthRequestsApiArg,
  useGetAuthRequestsQuery,
  useLazyGetAuthRequestsQuery,
  useSetAuthRequestStatusMutation,
} from "../AuthRequestsApi";
import {
  authRequestStatus,
  toAuthRequestStatusTitle,
  toAuthRequestStatusColor,
  canReviewAuthRequest,
} from "../Utils";
import {
  newAuthRequestsInstance,
  resetAuthRequests,
  selectAuthRequestsFilters,
  setAuthRequestsPage,
  setAuthRequestsPageSize,
} from "../store/authRequestsSlice";
export default function AuthRequestsTable() {
  const { t } = useTranslation("authRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const { userId = "all" } = useParams(),
    location = useLocation();
  const routeKey = `${userId}/${user.role}/${location.search}`;
  const filters = useSelector(
    selectAuthRequestsFilters,
  ) as GetAuthRequestsApiArg;
  const [ready, setReady] = useState<string>();
  const canView = hasOperationPermission("auth-requests", "view", user),
    canReview =
      user.role !== "user" &&
      canView &&
      hasOperationPermission("auth-requests", "update", user);
  useEffect(() => {
    dispatch(
      newAuthRequestsInstance({
        userIdFilter: user.role === "user" ? "all" : userId,
      }),
    );
    setReady(routeKey);
  }, [dispatch, routeKey]);
  useEffect(
    () => () => {
      dispatch(resetAuthRequests(null));
    },
    [dispatch],
  );
  const { data, isFetching, isError, refetch } = useGetAuthRequestsQuery(
    filters,
    { skip: !canView || ready !== routeKey, refetchOnMountOrArgChange: true },
  );
  const [getAll] = useLazyGetAuthRequestsQuery(),
    [setStatus, updating] = useSetAuthRequestStatusMutation();
  function review(row: IAuthRequest, next: "approved" | "rejected") {
    if (
      !canReview ||
      updating.isLoading ||
      !canReviewAuthRequest(row.status, next)
    )
      return;
    const key = next === authRequestStatus.confirmed ? "CONFIRMED" : "REFUSED";
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t(`CONVERT_TO_${key}_TITLE`)}
            message={t(`CONVERT_TO_${key}_MESSAGE`)}
            onSubmit={async () => {
              try {
                await setStatus({
                  id: row.id,
                  userId: row.userId,
                  status: next,
                }).unwrap();
                dispatch(
                  showMessage({
                    message: t(`CONVERTED_TO_${key}_SUCCESSFULLY`),
                    variant: "success",
                  }),
                );
              } catch {
                dispatch(
                  showMessage({
                    message: t(`SOMETHING_WENT_WRONG_WHEN_CONVERT_TO_${key}`),
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
  const fields: TableFieldProps<IAuthRequest>[] = [
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
            valueGetter: (row) =>
              `${row.user?.firstName || ""} ${row.user?.lastName || ""}`.trim(),
            flex: 1,
            minWidth: 100,
          },
        ]
      : []),
    {
      id: "description",
      label: t("REQUEST_NOTES_"),
      type: TableDataTypes.normal,
      flex: 1.3,
      minWidth: 130,
    },
    {
      id: "status",
      label: t("STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toAuthRequestStatusTitle(value)),
      toChipColor: toAuthRequestStatusColor,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "fileUrl",
      label: t("DOCUMENT_URL"),
      type: TableDataTypes.normal,
      flex: 0.9,
      minWidth: 90,
      renderCell: (params) =>
        params.row.fileUrl ? (
          <Button
            component="a"
            href={params.row.fileUrl}
            target="_blank"
            rel="noreferrer"
            variant="contained"
            size="small"
            color="secondary"
          >
            {t("DOWNLOAD_DOCUMENT")}
          </Button>
        ) : null,
    },
    {
      id: "createdAt",
      label: t("CREATED_AT"),
      type: TableDataTypes.date,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "updatedAt",
      label: t("UPDATED_AT"),
      type: TableDataTypes.date,
      flex: 0.6,
      minWidth: 60,
    },
    ...(canReview
      ? [
          {
            id: "actions" as const,
            label: t("ACTIONS"),
            type: TableDataTypes.actions,
            flex: 1.2,
            minWidth: 120,
            actions: [
              {
                title: t("REFUSE"),
                color: "error" as const,
                onActionClick: (row) => review(row, authRequestStatus.refused),
                conditions: [
                  { id: "status", equalsTo: authRequestStatus.pending },
                ],
              },
              {
                title: t("ACCEPT"),
                color: "success" as const,
                onActionClick: (row) =>
                  review(row, authRequestStatus.confirmed),
                conditions: [
                  { id: "status", equalsTo: authRequestStatus.pending },
                ],
              },
            ],
          },
        ]
      : []),
  ];
  if (!canView) return <Navigate to="/home" replace />;
  return (
    <div
      className="w-full flex flex-col h-full"
      data-testid="auth-requests-table"
    >
      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<IAuthRequest>
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
        noDataMessage={t("NO_AUTH_REQUESTS")}
        autoRowHeight
        estimatedRowHeight={100}
        checkboxSelection
        exportedFileName="Ashamco Express - Authorization"
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setAuthRequestsPageSize(pageSize));
          else dispatch(setAuthRequestsPage(page));
        }}
        tableToolbarSelectionExportAllButton={user.role !== "user"}
        tableToolbarSelectionExportAllButtonProps={{
          onClick: async () => {
            const response = await getAll({
              ...filters,
              page: 0,
              pageSize: 500000,
            }).unwrap();
            return { data: response.results, fields };
          },
        }}
      />
    </div>
  );
}
