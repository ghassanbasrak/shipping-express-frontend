import { useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import { Alert, Button, MenuItem, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  type TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { FetchStatus } from "../../utils/dataStatus";
import {
  useGetWarehousesQuery,
  useGetStoragePlansQuery,
  useGetSupplyRequestsQuery,
  useGetStorageProductsQuery,
} from "../StorageApi";
import { selectStorageLists, setStorageFilter } from "../store/storageSlice";
import { listPaths, type StorageListKind } from "./StorageListHeader";
import {
  merchantContactUrl,
  supplyStatuses,
  toSupplyStatusTitle,
} from "../Utils";
type StorageRow = {
  id: string;
  name?: string;
  sku?: string;
  warehouse?: string;
  owner?: string;
  phone?: string;
  address?: string;
  warehouseId?: string;
  quantity?: number;
  reserved?: number;
  available?: number;
  unitPrice?: number;
  status?: string;
  type?: string;
  createdAt?: string;
  active?: boolean;
  price?: number;
};
export default function StorageListTable({ kind }: { kind: StorageListKind }) {
  const { t } = useTranslation("storageApp"),
    navigate = useNavigate(),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    filter = useSelector(selectStorageLists)[kind];
  const params = { admin: user.role === "admin" };
  const warehouses = useGetWarehousesQuery(params, {
    skip: kind !== "warehouses",
    refetchOnMountOrArgChange: true,
  });
  const plans = useGetStoragePlansQuery(params, {
    skip: kind !== "plans",
    refetchOnMountOrArgChange: true,
  });
  const supplies = useGetSupplyRequestsQuery(
    { ...params, userId: user.id },
    { skip: kind !== "supplies", refetchOnMountOrArgChange: true },
  );
  const products = useGetStorageProductsQuery(
    { userId: user.id },
    {
      skip: kind !== "products" || user.role !== "user",
      refetchOnMountOrArgChange: true,
    },
  );
  const warehouseOptions = useGetWarehousesQuery(params, {
    skip: kind !== "supplies" && kind !== "products",
  });
  const query =
    kind === "warehouses"
      ? warehouses
      : kind === "plans"
        ? plans
        : kind === "supplies"
          ? supplies
          : products;
  const rows: StorageRow[] = useMemo(
    () =>
      kind === "warehouses"
        ? (warehouses.currentData || []).map((row) => ({
            id: row.id,
            name: row.name,
            address: row.address,
          }))
        : kind === "plans"
          ? (plans.currentData || []).map((row) => ({
              id: row.id,
              name: row.name,
              price: row.discountPrice ?? row.price,
              active: row.isActive,
            }))
          : kind === "supplies"
            ? (supplies.currentData || []).map((row) => ({
                id: row.id,
                name: row.id.slice(-8),
                warehouse:
                  row.warehouse?.name ||
                  warehouseOptions.currentData?.find(
                    (item) => item.id === row.warehouseId,
                  )?.name ||
                  row.warehouseId,
                warehouseId: row.warehouseId,
                owner:
                  row.user?.companyName ||
                  [row.user?.firstName, row.user?.lastName]
                    .filter(Boolean)
                    .join(" "),
                phone: row.user?.phone,
                status: row.status,
                quantity: row.products.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                ),
                createdAt: row.createdAt,
              }))
            : (products.currentData || []).map((row) => ({
                id: row.id,
                name: row.name,
                sku: row.sku,
                warehouse:
                  row.warehouse?.name ||
                  warehouseOptions.currentData?.find(
                    (item) => item.id === row.warehouseId,
                  )?.name ||
                  row.warehouseId,
                warehouseId: row.warehouseId,
                owner: row.user?.companyName || row.user?.firstName,
                type: row.storageType,
                quantity: row.quantity,
                unitPrice: row.unitPrice,
              })),
    [
      kind,
      warehouses.currentData,
      plans.currentData,
      supplies.currentData,
      products.currentData,
      warehouseOptions.currentData,
    ],
  );
  const field = (
    id: keyof StorageRow,
    label: string,
    flex: number,
    type = TableDataTypes.normal,
  ): TableFieldProps<StorageRow> => ({
    id,
    label: t(label),
    type,
    flex,
    minWidth: flex * 100,
  });
  const fields: TableFieldProps<StorageRow>[] = [
    field("name", kind === "supplies" ? "REQUEST_NUMBER" : "NAME", 1.2),
  ];
  if (kind === "products")
    fields.push(
      field("sku", "SKU", 0.7),
      field("type", "STORAGE_TYPE", 0.9),
      field("quantity", "AVAILABLE", 0.6),
      field("unitPrice", "LAST_UNIT_PRICE", 0.7),
    );
  if (kind === "supplies" || kind === "products") {
    fields.push(field("warehouse", "WAREHOUSE", 1));
    if (user.role === "admin") fields.push(field("owner", "MERCHANT", 1));
  }
  if (kind === "supplies")
    fields.push(
      field("quantity", "QUANTITY", 0.6),
      {
        ...field("status", "STATUS", 0.7),
        valueGetter: (row) => t(toSupplyStatusTitle(row.status)),
      },
      field("createdAt", "CREATED_AT", 0.7, TableDataTypes.date),
    );
  if (kind === "plans")
    fields.push({
      ...field("active", "ACTIVE", 0.3),
      valueGetter: (row) => t(row.active ? "YES" : "NO"),
    });
  if (kind === "warehouses") fields.push(field("address", "ADDRESS", 1.3));
  if (kind === "plans") fields.push(field("price", "PRICE", 0.7));
  if (kind !== "products")
    fields.push({
      ...field("id", "ACTIONS", 1.3, TableDataTypes.actions),
      actions: [
        {
          title: t("VIEW"),
          color: "primary",
          onActionClick: (row) => navigate(listPaths[kind] + "/" + row.id),
        },
        ...(kind === "supplies" && user.role === "admin"
          ? [
              {
                title: t("CONTACT_MERCHANT"),
                color: "success" as const,
                onActionClick: (row: StorageRow) => {
                  const url = merchantContactUrl(row.phone);
                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                },
              },
            ]
          : []),
      ],
    });
  const filtered = rows.filter(
    (row) =>
      (!filter.warehouseId || row.warehouseId === filter.warehouseId) &&
      (!filter.status || row.status === filter.status) &&
      Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(filter.searchText.toLowerCase()),
      ),
  );
  useEffect(() => {
    if (
      !query.isFetching &&
      !query.isError &&
      filter.page > 0 &&
      filter.page * filter.pageSize >= filtered.length
    )
      dispatch(
        setStorageFilter({
          list: kind,
          field: "page",
          value: Math.max(0, Math.ceil(filtered.length / filter.pageSize) - 1),
        }),
      );
  }, [
    filtered.length,
    query.isFetching,
    query.isError,
    filter.page,
    filter.pageSize,
    dispatch,
    kind,
  ]);
  return (
    <div
      className="w-full h-full flex flex-col"
      data-testid={"storage-list-" + kind}
    >
      {(kind === "supplies" || kind === "products") && (
        <div className="flex flex-wrap gap-12 p-16">
          <TextField
            select
            size="small"
            className="w-full sm:w-256"
            label={t("WAREHOUSE")}
            value={filter.warehouseId}
            onChange={(event) =>
              dispatch(
                setStorageFilter({
                  list: kind,
                  field: "warehouseId",
                  value: event.target.value,
                }),
              )
            }
          >
            <MenuItem value="">{t("ALL")}</MenuItem>
            {(warehouseOptions.currentData || []).map((row) => (
              <MenuItem key={row.id} value={row.id}>
                {row.name}
              </MenuItem>
            ))}
            {!!filter.warehouseId &&
              !warehouseOptions.currentData?.some(
                (row) => row.id === filter.warehouseId,
              ) && (
                <MenuItem value={filter.warehouseId}>
                  {filter.warehouseId}
                </MenuItem>
              )}
          </TextField>
          {kind === "supplies" && (
            <TextField
              select
              size="small"
              className="w-full sm:w-200"
              label={t("STATUS")}
              value={filter.status}
              onChange={(event) =>
                dispatch(
                  setStorageFilter({
                    list: kind,
                    field: "status",
                    value: event.target.value,
                  }),
                )
              }
            >
              <MenuItem value="">{t("ALL")}</MenuItem>
              {Object.values(supplyStatuses).map((status) => (
                <MenuItem key={status} value={status}>
                  {t(toSupplyStatusTitle(status))}
                </MenuItem>
              ))}
            </TextField>
          )}
          {warehouseOptions.isError && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => warehouseOptions.refetch()}
            >
              {t("RETRY")}
            </Button>
          )}
        </div>
      )}
      {query.isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => query.refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<StorageRow>
        data={filtered.slice(
          filter.page * filter.pageSize,
          (filter.page + 1) * filter.pageSize,
        )}
        fields={fields}
        total={filtered.length}
        status={
          query.isError
            ? FetchStatus.error
            : query.isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        page={filter.page}
        pageSize={filter.pageSize}
        noDataMessage={t("NO_RESULTS")}
        onChangePagination={({ page, pageSize }) =>
          dispatch(
            setStorageFilter({
              list: kind,
              field: pageSize !== filter.pageSize ? "pageSize" : "page",
              value: pageSize !== filter.pageSize ? pageSize : page,
            }),
          )
        }
      />
    </div>
  );
}
