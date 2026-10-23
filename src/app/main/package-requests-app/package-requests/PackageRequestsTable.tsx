import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, Dialog } from "@mui/material";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import IPackageRequest from "../models/IPackageRequest";
import {
  GetPackageRequestsApiArg,
  useGetPackageRequestsQuery,
  useLazyGetPackageRequestsQuery,
} from "../PackageRequestsApi";
import {
  packageRequestStatus,
  toPackageRequestStatusTitle,
  toPackageRequestStatusColor,
  canReviewPackageRequest,
  packagingSuppliesLabel,
} from "../Utils";
import {
  newPackageRequestsInstance,
  resetPackageRequests,
  selectPackageRequestsFilters,
  setPackageRequestsPage,
  setPackageRequestsPageSize,
} from "../store/packageRequestsSlice";
import PackageRequestReviewDialog from "../shared-components/dialogs/PackageRequestReviewDialog";
export default function PackageRequestsTable() {
  const { t } = useTranslation("packageRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const { userId = "all" } = useParams(),
    location = useLocation();
  const routeKey = `${userId}/${user.role}/${location.search}`;
  const filters = useSelector(
    selectPackageRequestsFilters,
  ) as GetPackageRequestsApiArg;
  const [ready, setReady] = useState<string>();
  const [dialog, setDialog] = useState<{
    id: string;
    mode: "view" | "approved" | "rejected";
  }>();
  const canView = hasOperationPermission("package-requests", "view", user);
  useEffect(() => {
    dispatch(
      newPackageRequestsInstance({
        userIdFilter: user.role === "user" ? "all" : userId,
        updatedByIdFilter:
          new URLSearchParams(location.search).get("updatedById") || "",
      }),
    );
    setReady(routeKey);
    setDialog(undefined);
  }, [dispatch, routeKey]);
  useEffect(
    () => () => {
      dispatch(resetPackageRequests(null));
    },
    [dispatch],
  );
  const { data, currentData, isFetching, isError, refetch } =
    useGetPackageRequestsQuery(filters, {
      skip: !canView || ready !== routeKey,
      refetchOnMountOrArgChange: true,
    });
  const [getAll] = useLazyGetPackageRequestsQuery();
  useEffect(() => {
    if (
      currentData &&
      !isFetching &&
      filters.page > 0 &&
      filters.page >
        Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setPackageRequestsPage(
          Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1),
        ),
      );
  }, [currentData, isFetching, filters.page, filters.pageSize, dispatch]);
  function review(row: IPackageRequest, mode: "approved" | "rejected") {
    if (canReviewPackageRequest(user, row.status))
      setDialog({ id: row.id, mode });
  }
  const fields: TableFieldProps<IPackageRequest>[] = [
    {
      id: "productIds",
      label: t("PRODUCTS"),
      type: TableDataTypes.normal,
      valueGetter: (row) => packagingSuppliesLabel(row.products),
      flex: 1.2,
      minWidth: 120,
    },
    ...(user.role !== "user"
      ? [
          {
            id: "user.firstName" as const,
            label: t("MERCHANT"),
            type: TableDataTypes.normal,
            valueGetter: (row: IPackageRequest) =>
              `${row.user?.firstName || ""} ${row.user?.lastName || ""}`,
            flex: 1.1,
            minWidth: 110,
          },
        ]
      : []),
    {
      id: "description",
      label: t("NOTES"),
      type: TableDataTypes.normal,
      flex: 1.2,
      minWidth: 120,
    },
    {
      id: "amount",
      label: t("AMOUNT"),
      type: TableDataTypes.money,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "status",
      label: t("STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toPackageRequestStatusTitle(value)),
      toChipColor: toPackageRequestStatusColor,
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
      keepItemsCount: 3,
      flex: 1.3,
      minWidth: 130,
      actions: [
        ...(user.role !== "user" &&
        canView &&
        hasOperationPermission("package-requests", "update", user)
          ? [
              {
                title: t("REJECT"),
                color: "error" as const,
                onActionClick: (row: IPackageRequest) =>
                  review(row, "rejected"),
                conditions: [
                  { id: "status", equalsTo: packageRequestStatus.pending },
                ],
              },
              {
                title: t("ACCEPT"),
                color: "success" as const,
                onActionClick: (row: IPackageRequest) =>
                  review(row, "approved"),
                conditions: [
                  { id: "status", equalsTo: packageRequestStatus.pending },
                ],
              },
            ]
          : []),
        {
          title: t("VIEW"),
          color: "secondary",
          onActionClick: (row: IPackageRequest) =>
            setDialog({ id: row.id, mode: "view" }),
          keepOnView: true,
        },
      ],
    },
  ];
  if (!canView) return <Navigate to="/home" replace />;
  return (
    <div
      className="w-full flex flex-col h-full"
      data-testid="package-requests-table"
    >
      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<IPackageRequest>
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
        noDataMessage={t("NO_PACKAGE_REQUESTS")}
        autoRowHeight
        estimatedRowHeight={150}
        checkboxSelection
        exportedFileName="Ashamco Express - Packaging"
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setPackageRequestsPageSize(pageSize));
          else dispatch(setPackageRequestsPage(page));
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
      <Dialog
        open={Boolean(dialog)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="package-request-review-title"
      >
        {dialog && (
          <PackageRequestReviewDialog
            {...dialog}
            onClose={() => setDialog(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
