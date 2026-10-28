import { hasOperationPermission as merchantProfilePermission } from "src/app/auth/permissions";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import ICancelShipmentRequest from "../models/ICancelShipmentRequest";
import {
  GetCancelShipmentRequestsApiArg,
  useGetCancelShipmentRequestsQuery,
  useLazyGetCancelShipmentRequestsQuery,
} from "../CancelShipmentRequestsApi";
import {
  canViewCancellationRequests,
  canReviewCancellationRequest,
  canViewCancellationTransactions,
  toCancelShipmentRequestStatusTitle,
  toCancelShipmentRequestStatusColor,
  datesValid,
} from "../Utils";
import {
  selectCancelShipmentRequestsFilters,
  newCancelShipmentRequestsInstance,
  resetCancelShipmentRequests,
  setCancelShipmentRequestsPage,
  setCancelShipmentRequestsPageSize,
} from "../store/cancelShipmentRequestsSlice";
import CancellationDecisionDialog from "../shared-components/CancellationDecisionDialog";
import CancellationTransactionsDialog from "../shared-components/CancellationTransactionsDialog";
export default function CancelShipmentRequestsTable() {
  const { t } = useTranslation("cancelShipmentRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    { userId = "all" } = useParams(),
    location = useLocation(),
    filters = useSelector(
      selectCancelShipmentRequestsFilters,
    ) as GetCancelShipmentRequestsApiArg;
  const key = `${userId}/${user.id}/${user.role}/${location.search}`,
    canView = canViewCancellationRequests(user),
    [ready, setReady] = useState(""),
    [decision, setDecision] = useState<{
      id: string;
      status: string;
      shipmentId?: string;
      next: "approved" | "rejected";
    }>(),
    [ledger, setLedger] = useState<{
      id: string;
      userId: string;
      trackingNumber: string;
    }>();
  useEffect(() => {
    dispatch(
      newCancelShipmentRequestsInstance({
        instanceKey: key,
        userIdFilter: user.role === "user" ? "all" : userId,
        updatedByIdFilter:
          user.role === "admin"
            ? new URLSearchParams(location.search).get("updatedById") || ""
            : "",
      }),
    );
    setReady(key);
    setDecision(undefined);
    setLedger(undefined);
  }, [dispatch, key]);
  useEffect(
    () => () => {
      dispatch(resetCancelShipmentRequests(null));
    },
    [dispatch],
  );
  const scoped = {
      ...filters,
      userIdFilter: user.role === "user" ? "all" : filters.userIdFilter,
      updatedByIdFilter: user.role === "admin" ? filters.updatedByIdFilter : "",
    },
    valid = datesValid(filters);
  const { data, currentData, isFetching, isError, refetch } =
      useGetCancelShipmentRequestsQuery(scoped, {
        skip: !canView || ready !== key || !valid,
        refetchOnMountOrArgChange: true,
      }),
    [getAll] = useLazyGetCancelShipmentRequestsQuery();
  useEffect(() => {
    if (
      currentData &&
      !isFetching &&
      filters.page >
        Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setCancelShipmentRequestsPage(
          Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1),
        ),
      );
  }, [currentData, isFetching, filters.page, filters.pageSize, dispatch]);
  const fields: TableFieldProps<ICancelShipmentRequest>[] = [
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
            valueGetter: (row: ICancelShipmentRequest) =>
              `${row.user?.firstName || ""} ${row.user?.lastName || ""}`,
            flex: 1.1,
            minWidth: 110,
          },
        ]
      : []),
    ...(user.role === "admin"
      ? [
          {
            id: "updatedBy.firstName" as const,
            label: t("UPDATED_BY"),
            type: TableDataTypes.normal,
            valueGetter: (row: ICancelShipmentRequest) =>
              `${row.updatedBy?.firstName || ""} ${row.updatedBy?.lastName || ""}`,
            flex: 1,
            minWidth: 100,
          },
        ]
      : []),
    {
      id: "shipmentId",
      label: t("SHIPMENT"),
      type: TableDataTypes.normal,
      valueGetter: (row) => row.shipment?.trackingNumber || t("NO_WAYBILL"),
      flex: 1,
      minWidth: 100,
      renderCell: ({ row }) =>
        row.shipmentId ? (
          <Link
            className="underline break-words"
            to={`/shipments/all/all/${row.shipmentId}`}
          >
            {row.shipment?.trackingNumber || t("NO_WAYBILL")}
          </Link>
        ) : (
          t("NO_WAYBILL")
        ),
    },
    {
      id: "status",
      label: t("STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toCancelShipmentRequestStatusTitle(value)),
      toChipColor: toCancelShipmentRequestStatusColor,
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
      id: "updatedAt",
      label: t("UPDATED_AT"),
      type: TableDataTypes.date,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "actions",
      label: t("ACTIONS"),
      type: TableDataTypes.actions,
      flex: 1.3,
      minWidth: 130,
      renderCell: ({ row }) => (
        <div className="flex flex-wrap gap-8">
          {canReviewCancellationRequest(user, row) && (
            <>
              {(["rejected", "approved"] as const).map((next) => (
                <Button
                  key={next}
                  size="small"
                  color={next === "approved" ? "success" : "error"}
                  onClick={() =>
                    setDecision({
                      id: row.id,
                      status: row.status,
                      shipmentId: row.shipmentId,
                      next,
                    })
                  }
                >
                  {t(next === "approved" ? "ACCEPT" : "REFUSE")}
                </Button>
              ))}
            </>
          )}
          {row.shipment?.trackingUrl && (
            <Button
              size="small"
              component="a"
              href={row.shipment.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("TRACK_SHIPMENT")}
            </Button>
          )}
          {canViewCancellationTransactions(user, row) && (
            <Button
              size="small"
              onClick={() =>
                setLedger({
                  id: row.id,
                  userId: row.userId,
                  trackingNumber: row.shipment.trackingNumber,
                })
              }
            >
              {t("TRANSACTIONS")}
            </Button>
          )}
        </div>
      ),
    },
  ];
  if (!canView) return <Navigate to="/home" replace />;
  return (
    <div
      className="w-full flex flex-col h-full"
      data-testid="cancel-shipment-requests-table"
    >
      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      {!valid && <Alert severity="error">{t("INVALID_DATE_RANGE")}</Alert>}
      <CustomTable
        fields={fields}
        data={ready === key && valid ? data?.results || [] : []}
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
        noDataMessage={t("NO_CANCEL_SHIPMENT_REQUESTS")}
        checkboxSelection
        autoRowHeight
        estimatedRowHeight={100}
        exportedFileName="Ashamco Cancellation Requests"
        onChangePagination={({ page, pageSize }) =>
          pageSize !== filters.pageSize
            ? dispatch(setCancelShipmentRequestsPageSize(pageSize))
            : dispatch(setCancelShipmentRequestsPage(page))
        }
        tableToolbarSelectionExportAllButton={
          user.role !== "user" && valid && ready === key
        }
        tableToolbarSelectionExportAllButtonProps={{
          onClick: async () => ({
            data: (
              await getAll({ ...scoped, page: 0, pageSize: 500000 }).unwrap()
            ).results,
            fields,
          }),
        }}
      />
      {decision && (
        <CancellationDecisionDialog
          {...decision}
          onClose={() => setDecision(undefined)}
        />
      )}{" "}
      {ledger && (
        <CancellationTransactionsDialog
          {...ledger}
          onClose={() => setLedger(undefined)}
        />
      )}
    </div>
  );
}
