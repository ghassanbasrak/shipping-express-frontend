import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSearchParams, Link } from "react-router-dom";
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
  type ReviewSupplyArg,
} from "../StorageApi";
import { selectStorageLists, setStorageFilter } from "../store/storageSlice";
import { listPaths, type StorageListKind } from "./StorageListHeader";
import {
  allowedSupplyTransitions,
  merchantContactUrl,
  supplyStatuses,
  toSupplyStatusTitle,
  toSupplyStatusColor,
  toStorageTypeTitle,
  toStorageTypeColor,
} from "../Utils";
import SupplyReviewDialog from "../supply/SupplyReviewDialog";
import { displayName } from "../../countries-app/Utils";
type StorageRow = {
  id: string;
  name?: string;
  sku?: string;
  warehouse?: string;
  owner?: string;
  userId?: string;
  phone?: string;
  contactUrl?: string;
  email?: string;
  pickup?: string;
  warehouseId?: string;
  quantity?: number;
  unitPrice?: number;
  status?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
  price?: number;
  productsCount?: number;
  storageTypes?: string;
  features?: string;
  durationDays?: number;
  products?: { name: string; warehouseProductId?: string }[];
  mapAddress?: string;
  information?: string;
};
export default function StorageListTable({ kind }: { kind: StorageListKind }) {
  const { t } = useTranslation("storageApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    filter = useSelector(selectStorageLists)[kind],
    [params] = useSearchParams();
  const [decision, setDecision] = useState<ReviewSupplyArg>();
  const options = { admin: user.role === "admin" };
  const warehouses = useGetWarehousesQuery(options, {
    skip: kind !== "warehouses",
    refetchOnMountOrArgChange: true,
  });
  const plans = useGetStoragePlansQuery(options, {
    skip: kind !== "plans",
    refetchOnMountOrArgChange: true,
  });
  const supplies = useGetSupplyRequestsQuery(
    { ...options, userId: user.id },
    { skip: kind !== "supplies", refetchOnMountOrArgChange: true },
  );
  const products = useGetStorageProductsQuery(
    { ...options, userId: user.id, includeEmpty: true },
    { skip: kind !== "products", refetchOnMountOrArgChange: true },
  );
  const warehouseOptions = useGetWarehousesQuery(options, {
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
  const accountName = (row) =>
    row.user?.companyName ||
    [row.user?.firstName, row.user?.lastName].filter(Boolean).join(" ") ||
    row.userId;
  const warehouseName = (row) =>
    row.warehouse?.name ||
    warehouseOptions.currentData?.find((w) => w.id === row.warehouseId)?.name ||
    row.warehouseId;
  const rows: StorageRow[] = useMemo(
    () =>
      kind === "warehouses"
        ? (warehouses.currentData || []).map((row) => ({
            id: row.id,
            name: row.name,
            phone: row.pickup?.phone,
            email: row.pickup?.email,
            pickup: [
              displayName(row.pickup?.country?.name) || row.pickup?.countryId,
              displayName(row.pickup?.state?.name) || row.pickup?.stateId,
              displayName(row.pickup?.city?.name) || row.pickup?.cityId,
              row.pickup?.street,
              row.pickup?.nationalAddress,
              row.pickup?.zipCode,
            ]
              .filter(Boolean)
              .join(" · "),
            productsCount: row.productsCount,
            storageTypes: row.storageTypes
              ?.map((v) => t(toStorageTypeTitle(v)))
              .join(", "),
            mapAddress: row.mapAddress,
            information: row.information,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          }))
        : kind === "plans"
          ? (plans.currentData || []).map((row) => ({
              id: row.id,
              name: row.name,
              price: row.discountPrice ?? row.price,
              active: row.isActive,
              durationDays: row.durationDays,
              features: row.features.join(" · "),
              storageTypes: row.storageTypes
                ?.map((v) => t(toStorageTypeTitle(v)))
                .join(", "),
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
            }))
          : kind === "supplies"
            ? (supplies.currentData || [])
                .filter(
                  (row) => user.role === "admin" || row.userId === user.id,
                )
                .map((row) => ({
                  id: row.id,
                  name: row.id.slice(-8),
                  warehouse: warehouseName(row),
                  warehouseId: row.warehouseId,
                  userId: row.userId,
                  owner: accountName(row),
                  phone: row.user?.phone,
                  contactUrl: merchantContactUrl(row.user?.phone),
                  status: row.status,
                  quantity: row.products.reduce(
                    (sum, p) => sum + p.quantity,
                    0,
                  ),
                  productsCount: row.products.length,
                  products: row.products,
                  price: row.products.reduce(
                    (sum, p) => sum + p.quantity * (p.unitPrice || 0),
                    0,
                  ),
                  createdAt: row.createdAt,
                  updatedAt: row.updatedAt,
                }))
            : (products.currentData || [])
                .filter(
                  (row) => user.role === "admin" || row.userId === user.id,
                )
                .map((row) => ({
                  id: row.id,
                  name: row.name,
                  sku: row.sku,
                  warehouse: warehouseName(row),
                  warehouseId: row.warehouseId,
                  userId: row.userId,
                  owner: accountName(row),
                  type: row.storageType,
                  quantity: row.quantity,
                  unitPrice: row.unitPrice,
                  createdAt: row.createdAt,
                  updatedAt: row.updatedAt,
                })),
    [
      kind,
      warehouses.currentData,
      plans.currentData,
      supplies.currentData,
      products.currentData,
      warehouseOptions.currentData,
      user.id,
      user.role,
      t,
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
      {
        ...field("type", "STORAGE_TYPE", 0.7),
        chip: true,
        toChipTitle: (v) => t(toStorageTypeTitle(v)),
        toChipColor: toStorageTypeColor,
      },
      field("quantity", "AVAILABLE", 0.6),
      field("unitPrice", "LAST_UNIT_PRICE", 0.7, TableDataTypes.money),
    );
  if (kind === "supplies" || kind === "products") {
    fields.push({
      ...field("warehouse", "WAREHOUSE", 1),
      link: user.role === "admin",
      linkGetter: (r) => "/storage/warehouses/" + r.warehouseId,
    });
    if (user.role === "admin")
      fields.push({
        ...field("owner", "MERCHANT", 1.1),
        link: true,
        linkGetter: (r) => `/merchants/${r.userId}/view`,
      });
  }
  if (kind === "supplies")
    fields.push(
      field("quantity", "QUANTITY", 0.6),
      field("productsCount", "PRODUCTS_COUNT", 0.6),
      {
        ...field("products", "PRODUCTS", 1.3),
        valueGetter: (r) => r.products?.map((p) => p.name).join(", "),
        renderCell: ({ row }) => (
          <div className="flex flex-wrap gap-4">
            {row.products?.map((p, i) =>
              user.role === "admin" ? (
                <Typography
                  key={i}
                  className="text-12 underline"
                  color="primary"
                  component={Link}
                  to={
                    p.warehouseProductId
                      ? `/storage/products/${p.warehouseProductId}`
                      : `/storage/products?warehouseId=${encodeURIComponent(row.warehouseId)}`
                  }
                >
                  {p.name}
                </Typography>
              ) : (
                <span key={i}>{p.name}</span>
              ),
            )}
          </div>
        ),
      },
      {
        ...field("status", "STATUS", 0.7),
        chip: true,
        toChipTitle: (v) => t(toSupplyStatusTitle(v)),
        toChipColor: toSupplyStatusColor,
      },
      field("price", "PRODUCTS_VALUE", 0.7, TableDataTypes.money),
    );
  if (kind === "plans")
    fields.push(
      field("price", "PRICE", 0.7, TableDataTypes.money),
      field("durationDays", "DURATION_DAYS", 0.6),
      field("features", "PLAN_FEATURES", 1.3),
      field("storageTypes", "STORAGE_TYPES", 1.1),
      {
        ...field("active", "ACTIVE", 0.3),
        valueGetter: (r) => t(r.active ? "YES" : "NO"),
      },
    );
  if (kind === "warehouses")
    fields.push(
      field("phone", "PICKUP_PHONE", 0.9),
      field("email", "EMAIL", 0.9),
      field("pickup", "PICKUP_DETAILS", 1.3),
      field("storageTypes", "STORAGE_TYPES", 1.1),
      field("productsCount", "PRODUCTS_COUNT", 0.6),
      field("information", "WAREHOUSE_INFORMATION", 1.3),
    );
  fields.push(
    field("createdAt", "CREATED_AT", 0.7, TableDataTypes.date),
    field("updatedAt", "UPDATED_AT", 0.7, TableDataTypes.date),
  );
  if (kind !== "products" || user.role === "admin")
    fields.push({
      id: "actions",
      label: t("ACTIONS"),
      type: TableDataTypes.actions,
      flex: 1.3,
      minWidth: 130,
      exportable: false,
      actions: [
        {
          title: t(kind === "products" ? "EDIT" : "VIEW"),
          color: "secondary",
          link: true,
          linkGetter: (row) => listPaths[kind] + "/" + row.id,
        },
        ...(kind === "warehouses"
          ? [
              {
                title: t("PRODUCTS"),
                link: true,
                linkGetter: (row: StorageRow) =>
                  "/storage/products?warehouseId=" + encodeURIComponent(row.id),
              },
            ]
          : []),
        ...(kind === "supplies" && user.role === "admin"
          ? [
              {
                title: t("CONTACT_MERCHANT"),
                link: true,
                linkGetter: (row: StorageRow) => row.contactUrl,
                target: "_blank",
                conditions: [{ id: "contactUrl" }],
              },
              ...[
                supplyStatuses.approved,
                supplyStatuses.received,
                supplyStatuses.rejected,
              ].map((status) => ({
                title: t(
                  status === supplyStatuses.approved
                    ? "APPROVE"
                    : status === supplyStatuses.received
                      ? "RECEIVE"
                      : "REJECT",
                ),
                color:
                  status === supplyStatuses.rejected
                    ? ("error" as const)
                    : ("primary" as const),
                conditions: [
                  {
                    id: "status",
                    equalsTo:
                      status === supplyStatuses.received
                        ? supplyStatuses.approved
                        : supplyStatuses.pending,
                    ...(status === supplyStatuses.rejected
                      ? { orEqualsTo: supplyStatuses.approved }
                      : {}),
                  },
                ],
                onActionClick: (row: StorageRow) => {
                  if (allowedSupplyTransitions(row.status).includes(status))
                    setDecision({ id: row.id, status });
                },
              })),
            ]
          : []),
      ],
    });
  useEffect(() => {
    dispatch(
      setStorageFilter({
        list: kind,
        field: "warehouseId",
        value: params.get("warehouseId") || "",
      }),
    );
  }, [params.get("warehouseId"), kind, dispatch]);
  const filtered = rows.filter(
    (r) =>
      (!filter.warehouseId || r.warehouseId === filter.warehouseId) &&
      (!filter.status || r.status === filter.status) &&
      (!params.get("productId") || r.id === params.get("productId")) &&
      Object.values(r).some((v) =>
        String(v ?? "")
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
      {decision && (
        <SupplyReviewDialog
          decision={decision}
          onClose={() => setDecision(undefined)}
        />
      )}
    </div>
  );
}
