import { hasOperationPermission as merchantProfilePermission } from "src/app/auth/permissions";
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

import { FetchStatus } from "src/app/main/utils/dataStatus";
import IWithdrawRequest from "../models/IWithdrawRequest";
import {
  GetWithdrawRequestsApiArg,
  useGetWithdrawRequestsQuery,
  useLazyGetWithdrawRequestsQuery,
} from "../WithdrawRequestsApi";
import {
  invalidWithdrawalDates,
  toWithdrawRequestTypeTitle,
  toWithdrawRequestTypeColor,
  withdrawRequestStatus,
  toWithdrawRequestStatusTitle,
  toWithdrawRequestStatusColor,
  canReviewWithdrawRequest,
  canViewWithdrawRequests,
} from "../Utils";
import {
  newWithdrawRequestsInstance,
  resetWithdrawRequests,
  selectWithdrawRequestsFilters,
  setWithdrawRequestsPage,
  setWithdrawRequestsPageSize,
} from "../store/withdrawRequestsSlice";
import WithdrawRequestDecisionDialog from "../shared-components/dialogs/withdraw-request-decision-dialog/WithdrawRequestDecisionDialog";
import WithdrawRequestImageDialog from "../shared-components/dialogs/image-dialog/WithdrawRequestImageDialog";
export default function WithdrawRequestsTable() {
  const { t } = useTranslation("withdrawRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const { userId = "all" } = useParams(),
    location = useLocation();
  const routeKey = `${userId}/${user.role}/${location.search}`;
  const filters = useSelector(
    selectWithdrawRequestsFilters,
  ) as GetWithdrawRequestsApiArg;
  const invalidDates = invalidWithdrawalDates(filters);
  const [ready, setReady] = useState<string>();
  const [decision, setDecision] = useState<{
    id: string;
    userId?: string;
    bank?: string;
    transactionReference?: string;
    transactionDescription?: string;
    transactionImageUrl?: string;
    description?: string;
    type: string;
    status: string;
    next: "approved" | "rejected";
  }>();
  const [image, setImage] = useState<{
    id: string;
    url: string;
    reference?: string;
  }>();
  const canView = canViewWithdrawRequests(user);
  useEffect(() => {
    dispatch(
      newWithdrawRequestsInstance({
        userIdFilter: user.role === "user" ? "all" : userId,
        updatedByIdFilter:
          new URLSearchParams(location.search).get("updatedById") || "",
      }),
    );
    setReady(routeKey);
    setDecision(undefined);
    setImage(undefined);
  }, [dispatch, routeKey]);
  useEffect(
    () => () => {
      dispatch(resetWithdrawRequests(null));
    },
    [dispatch],
  );
  const { data, currentData, isFetching, isError, refetch } =
    useGetWithdrawRequestsQuery(filters, {
      skip: !canView || invalidDates || ready !== routeKey,
      refetchOnMountOrArgChange: true,
    });
  const [getAll] = useLazyGetWithdrawRequestsQuery();
  useEffect(() => {
    if (
      currentData &&
      !isFetching &&
      filters.page > 0 &&
      filters.page >
        Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setWithdrawRequestsPage(
          Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1),
        ),
      );
  }, [currentData, isFetching, filters.page, filters.pageSize, dispatch]);
  function review(row: IWithdrawRequest, next: "approved" | "rejected") {
    if (!canReviewWithdrawRequest(user, row.status)) return;
    setDecision({
      id: row.id,
      userId: row.userId,
      bank: row.bank,
      transactionReference: row.transactionReference,
      transactionDescription: row.transactionDescription,
      transactionImageUrl: row.transactionImageUrl,
      description: row.description,
      status: row.status,
      type: row.type,
      next,
    });
  }
  const fields: TableFieldProps<IWithdrawRequest>[] = [
    {
      id: "id",
      label: t("REFERENCE"),
      type: TableDataTypes.normal,
      flex: 0.7,
      minWidth: 70,
    },
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
            valueGetter: (row: IWithdrawRequest) =>
              `${row.user?.firstName || ""} ${row.user?.lastName || ""}`,
            flex: 1.1,
            minWidth: 110,
          },
          ...(user.role === "admin"
            ? [
                {
                  id: "updatedBy.firstName" as const,
                  label: t("UPDATED_BY"),
                  type: TableDataTypes.normal,
                  valueGetter: (row: IWithdrawRequest) =>
                    `${row.updatedBy?.firstName || ""} ${row.updatedBy?.lastName || ""}`,
                  flex: 1,
                  minWidth: 100,
                },
              ]
            : []),
        ]
      : []),
    {
      id: "amount",
      label: t("AMOUNT"),
      type: TableDataTypes.money,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "description",
      label: t("REQUEST_NOTES_"),
      type: TableDataTypes.normal,
      flex: 1.2,
      minWidth: 120,
    },
    {
      id: "transactionReference",
      label: t("TRANSACTION_REFERENCE"),
      type: TableDataTypes.normal,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "status",
      label: t("STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toWithdrawRequestStatusTitle(value)),
      toChipColor: toWithdrawRequestStatusColor,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "transactionDescription",
      label: t("TRANSACTION_NOTES"),
      type: TableDataTypes.normal,
      flex: 1.2,
      minWidth: 120,
    },
    {
      id: "type",
      label: t("TYPE"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toWithdrawRequestTypeTitle(value)),
      toChipColor: toWithdrawRequestTypeColor,
      flex: 0.6,
      minWidth: 60,
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
      actions: [
        ...(user.role !== "user" &&
        canView &&
        canReviewWithdrawRequest(user, withdrawRequestStatus.pending)
          ? [
              {
                title: t("REFUSE"),
                color: "error" as const,
                onActionClick: (row: IWithdrawRequest) =>
                  review(row, "rejected"),
                conditions: [
                  {
                    id: "status",
                    equalsTo: withdrawRequestStatus.pending,
                  },
                ],
              },
              {
                title: t("ACCEPT"),
                color: "success" as const,
                onActionClick: (row: IWithdrawRequest) =>
                  review(row, "approved"),
                conditions: [
                  {
                    id: "status",
                    equalsTo: withdrawRequestStatus.pending,
                  },
                ],
              },
            ]
          : []),
        {
          title: t("TRANSACTION_IMAGE"),
          color: "primary",
          keepOnView: true,
          onActionClick: (row: IWithdrawRequest) => {
            if (canView && row.transactionImageUrl)
              setImage({
                id: row.id,
                url: row.transactionImageUrl,
                reference: row.transactionReference,
              });
          },
          conditions: [{ id: "transactionImageUrl" }],
        },
      ],
    },
  ];
  if (!canView) return <Navigate to="/home" replace />;
  return (
    <div
      className="w-full flex flex-col h-full"
      data-testid="withdraw-requests-table"
    >
      {invalidDates && (
        <Alert severity="error">{t("INVALID_DATE_RANGE")}</Alert>
      )}
      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<IWithdrawRequest>
        fields={fields}
        data={data?.results || []}
        total={data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        status={
          isError || invalidDates
            ? FetchStatus.error
            : ready !== routeKey || isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        error={isError ? t("LOAD_ERROR") : undefined}
        noDataMessage={t("NO_WITHDRAW_REQUESTS")}
        autoRowHeight
        estimatedRowHeight={150}
        checkboxSelection
        exportedFileName="Ashamco - Withdraw"
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setWithdrawRequestsPageSize(pageSize));
          else dispatch(setWithdrawRequestsPage(page));
        }}
        tableToolbarSelectionExportAllButton={user.role !== "user"}
        tableToolbarSelectionExportAllButtonProps={{
          onClick: async () => {
            if (invalidDates) throw new Error(t("INVALID_DATE_RANGE"));
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
        open={Boolean(decision)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="withdraw-request-decision-title"
      >
        {decision && (
          <WithdrawRequestDecisionDialog
            {...decision}
            status={
              data?.results.find((row) => row.id === decision.id)?.status ??
              decision.status
            }
            onClose={() => setDecision(undefined)}
          />
        )}
      </Dialog>
      <Dialog
        open={Boolean(image)}
        fullWidth
        maxWidth="md"
        aria-labelledby="withdraw-request-image-title"
      >
        {image && (
          <WithdrawRequestImageDialog
            {...image}
            onClose={() => setImage(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
