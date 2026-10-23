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
import IVerificationRequest from "../models/IVerificationRequest";
import {
  GetVerificationRequestsApiArg,
  useGetVerificationRequestsQuery,
  useLazyGetVerificationRequestsQuery,
  useSetVerificationRequestStatusMutation,
} from "../VerificationRequestsApi";
import {
  verificationRequestStatus,
  toVerificationRequestStatusTitle,
  toVerificationRequestStatusColor,
  canReviewVerificationRequest,
  toVerificationRequestUserTypeTitle,
  toVerificationRequestUserTypeColor,
} from "../Utils";
import {
  newVerificationRequestsInstance,
  resetVerificationRequests,
  selectVerificationRequestsFilters,
  setVerificationRequestsPage,
  setVerificationRequestsPageSize,
} from "../store/verificationRequestsSlice";
export default function VerificationRequestsTable() {
  const { t } = useTranslation("verificationRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const { userId = "all" } = useParams(),
    location = useLocation();
  const routeKey = `${userId}/${user.role}/${location.search}`;
  const filters = useSelector(
    selectVerificationRequestsFilters,
  ) as GetVerificationRequestsApiArg;
  const [ready, setReady] = useState<string>();
  const canView = hasOperationPermission("verification-requests", "view", user),
    canReview =
      user.role !== "user" &&
      canView &&
      hasOperationPermission("verification-requests", "update", user);
  useEffect(() => {
    dispatch(
      newVerificationRequestsInstance({
        userIdFilter: user.role === "user" ? "all" : userId,
        updatedByIdFilter:
          new URLSearchParams(location.search).get("updatedById") || "",
      }),
    );
    setReady(routeKey);
  }, [dispatch, routeKey]);
  useEffect(
    () => () => {
      dispatch(resetVerificationRequests(null));
    },
    [dispatch],
  );
  const { data, isFetching, isError, refetch } =
    useGetVerificationRequestsQuery(filters, {
      skip: !canView || ready !== routeKey,
      refetchOnMountOrArgChange: true,
    });
  const [getAll] = useLazyGetVerificationRequestsQuery(),
    [setStatus, updating] = useSetVerificationRequestStatusMutation();
  function review(row: IVerificationRequest, next: "approved" | "rejected") {
    if (
      !canReview ||
      updating.isLoading ||
      !canReviewVerificationRequest(row.status, next)
    )
      return;
    const key =
      next === verificationRequestStatus.confirmed ? "CONFIRMED" : "REFUSED";
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
  const fields: TableFieldProps<IVerificationRequest>[] = [
    ...(user.role !== "user"
      ? [
          {
            id: "user.firstName" as const,
            label: t("MERCHANT"),
            type: TableDataTypes.normal,
            valueGetter: (row) =>
              `${row.user?.firstName || ""} ${row.user?.lastName || ""}`.trim(),
            flex: 1,
            minWidth: 100,
          },
        ]
      : []),
    ...(user.role === "admin"
      ? [
          {
            id: "updatedBy.firstName" as const,
            label: t("UPDATED_BY"),
            type: TableDataTypes.normal,
            valueGetter: (row) =>
              `${row.updatedBy?.firstName || ""} ${row.updatedBy?.lastName || ""}`.trim(),
            flex: 1,
            minWidth: 100,
          },
        ]
      : []),
    {
      id: "userType",
      label: t("USER_TYPE"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toVerificationRequestUserTypeTitle(value)),
      toChipColor: toVerificationRequestUserTypeColor,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "name",
      label: t("NAME"),
      type: TableDataTypes.normal,
      flex: 1.1,
      minWidth: 110,
    },
    {
      id: "taxNumber",
      label: t("TAX_NUMBER"),
      type: TableDataTypes.normal,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "crNumber",
      label: t("CR_NUMBER"),
      type: TableDataTypes.normal,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "status",
      label: t("STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toVerificationRequestStatusTitle(value)),
      toChipColor: toVerificationRequestStatusColor,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "freelanceDocumentUrl",
      label: t("FREELANCE"),
      type: TableDataTypes.normal,
      flex: 0.9,
      minWidth: 90,
      renderCell: (params) =>
        params.row.freelanceDocumentUrl ? (
          <Button
            component="a"
            href={params.row.freelanceDocumentUrl}
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
      id: "taxCertificateUrl",
      label: t("TAX_CERTIFICATION"),
      type: TableDataTypes.normal,
      flex: 0.9,
      minWidth: 90,
      renderCell: (params) =>
        params.row.taxCertificateUrl ? (
          <Button
            component="a"
            href={params.row.taxCertificateUrl}
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
      id: "crUrl",
      label: t("CR"),
      type: TableDataTypes.normal,
      flex: 0.9,
      minWidth: 90,
      renderCell: (params) =>
        params.row.crUrl ? (
          <Button
            component="a"
            href={params.row.crUrl}
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
                onActionClick: (row) =>
                  review(row, verificationRequestStatus.refused),
                conditions: [
                  {
                    id: "status",
                    equalsTo: verificationRequestStatus.pending,
                    orEqualsTo: verificationRequestStatus.confirmed,
                  },
                ],
              },
              {
                title: t("ACCEPT"),
                color: "success" as const,
                onActionClick: (row) =>
                  review(row, verificationRequestStatus.confirmed),
                conditions: [
                  {
                    id: "status",
                    equalsTo: verificationRequestStatus.pending,
                    orEqualsTo: verificationRequestStatus.refused,
                  },
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
      data-testid="verification-requests-table"
    >
      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<IVerificationRequest>
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
        noDataMessage={t("NO_VERIFICATION_REQUESTS")}
        autoRowHeight
        estimatedRowHeight={100}
        checkboxSelection
        exportedFileName="Ashamco Express - Verification"
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setVerificationRequestsPageSize(pageSize));
          else dispatch(setVerificationRequestsPage(page));
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
