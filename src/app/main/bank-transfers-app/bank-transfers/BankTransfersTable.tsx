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
import { hasOperationPermission } from "src/app/auth/permissions";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import IBankTransfer from "../models/IBankTransfer";
import {
  GetBankTransfersApiArg,
  useGetBankTransfersQuery,
  useLazyGetBankTransfersQuery,
} from "../BankTransfersApi";
import {
  bankTransferStatus,
  toBankTransferStatusTitle,
  toBankTransferStatusColor,
  canReviewBankTransfer,
} from "../Utils";
import {
  newBankTransfersInstance,
  resetBankTransfers,
  selectBankTransfersFilters,
  setBankTransfersPage,
  setBankTransfersPageSize,
} from "../store/bankTransfersSlice";
import BankTransferDecisionDialog from "../shared-components/dialogs/bank-transfer-decision-dialog/BankTransferDecisionDialog";
import BankTransferImageDialog from "../shared-components/dialogs/image-dialog/BankTransferImageDialog";
export default function BankTransfersTable() {
  const { t } = useTranslation("bankTransfersApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const { userId = "all" } = useParams(),
    location = useLocation();
  const routeKey = `${userId}/${user.role}/${location.search}`;
  const filters = useSelector(
    selectBankTransfersFilters,
  ) as GetBankTransfersApiArg;
  const [ready, setReady] = useState<string>();
  const [decision, setDecision] = useState<{
    id: string;
    userId?: string;
    bank?: string;
    status: string;
    next: "approved" | "rejected";
  }>();
  const [image, setImage] = useState<{
    id: string;
    url: string;
    reference?: string;
  }>();
  const canView = hasOperationPermission("bank-transfers", "view", user);
  useEffect(() => {
    dispatch(
      newBankTransfersInstance({
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
      dispatch(resetBankTransfers(null));
    },
    [dispatch],
  );
  const { data, currentData, isFetching, isError, refetch } =
    useGetBankTransfersQuery(filters, {
      skip: !canView || ready !== routeKey,
      refetchOnMountOrArgChange: true,
    });
  const [getAll] = useLazyGetBankTransfersQuery();
  useEffect(() => {
    if (
      currentData &&
      !isFetching &&
      filters.page > 0 &&
      filters.page >
        Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setBankTransfersPage(
          Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1),
        ),
      );
  }, [currentData, isFetching, filters.page, filters.pageSize, dispatch]);
  function review(row: IBankTransfer, next: "approved" | "rejected") {
    if (!canReviewBankTransfer(user, row.status)) return;
    setDecision({
      id: row.id,
      userId: row.userId,
      bank: row.bank,
      status: row.status,
      next,
    });
  }
  const fields: TableFieldProps<IBankTransfer>[] = [
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
            valueGetter: (row: IBankTransfer) =>
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
                  valueGetter: (row: IBankTransfer) =>
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
      id: "paymentPlan",
      label: t("PLAN"),
      type: TableDataTypes.normal,
      valueGetter: (row) => row.paymentPlan?.name,
      chip: true,
      toChipTitle: (value) => value,
      toChipColor: () => "bg-blue-500",
      flex: 1,
      minWidth: 100,
    },
    {
      id: "status",
      label: t("STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toBankTransferStatusTitle(value)),
      toChipColor: toBankTransferStatusColor,
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
      id: "notes",
      label: t("REJECTION_NOTES"),
      type: TableDataTypes.normal,
      flex: 1.2,
      minWidth: 120,
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
        hasOperationPermission("bank-transfers", "update", user)
          ? [
              {
                title: t("REFUSE"),
                color: "error" as const,
                onActionClick: (row: IBankTransfer) => review(row, "rejected"),
                conditions: [
                  { id: "status", equalsTo: bankTransferStatus.pending },
                ],
              },
              {
                title: t("ACCEPT"),
                color: "success" as const,
                onActionClick: (row: IBankTransfer) => review(row, "approved"),
                conditions: [
                  { id: "status", equalsTo: bankTransferStatus.pending },
                ],
              },
            ]
          : []),
        {
          title: t("TRANSACTION_IMAGE"),
          color: "primary",
          keepOnView: true,
          onActionClick: (row: IBankTransfer) => {
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
      data-testid="bank-transfers-table"
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
      <CustomTable<IBankTransfer>
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
        noDataMessage={t("NO_BANK_TRANSFERS")}
        autoRowHeight
        estimatedRowHeight={150}
        checkboxSelection
        exportedFileName="Ashamco Express - Bank Transfer"
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setBankTransfersPageSize(pageSize));
          else dispatch(setBankTransfersPage(page));
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
        open={Boolean(decision)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="bank-transfer-decision-title"
      >
        {decision && (
          <BankTransferDecisionDialog
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
        aria-labelledby="bank-transfer-image-title"
      >
        {image && (
          <BankTransferImageDialog
            {...image}
            onClose={() => setImage(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
