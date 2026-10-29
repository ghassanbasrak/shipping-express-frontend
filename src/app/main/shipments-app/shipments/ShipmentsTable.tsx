import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import {
  GetShipmentsApiArg,
  useGetShipmentsQuery,
  useLazyGetShipmentsQuery,
  useLazyGetShipmentLabelQuery,
  useLazyGetShipmentQuery,
} from "../ShipmentsApi";
import {
  canViewShipments,
  canUpdateShipment,
  canSettleShipment,
  shipmentErrorMessage,
} from "../Utils";
import {
  selectShipmentsFilters,
  newShipmentsInstance,
  resetShipments,
  setShipmentsPage,
  setShipmentsPageSize,
} from "../store/shipmentsSlice";
import shipmentFields from "../shared-components/ShipmentFields";
import {
  ShipmentOperationDialog,
  ShipmentOperation,
} from "../shared-components/ShipmentOperations";
import IShipment from "../models/IShipment";
import {
  downloadShipmentBlob,
  mergeShipmentLabels,
} from "../shared-components/documents";
import ShipmentsSummaryAnalytics from "./ShipmentsSummaryAnalytics";
export default function ShipmentsTable({
  fixedUserId,
}: { fixedUserId?: string } = {}) {
  const { t } = useTranslation("shipmentsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    location = useLocation(),
    { shippingCompanyId = "all", shippingType = "all" } = useParams(),
    filters = useSelector(selectShipmentsFilters) as GetShipmentsApiArg & {
      viewType: string;
    },
    [ready, setReady] = useState(""),
    [error, setError] = useState(""),
    [operation, setOperation] = useState<{
      rows: IShipment[];
      operation: ShipmentOperation;
    }>();
  const key = `${shippingCompanyId}/${shippingType}/${user.id}/${user.role}/${location.search}/${fixedUserId || ""}`,
    allowed = canViewShipments(user);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    dispatch(
      newShipmentsInstance({
        merchantIdFilter: fixedUserId || "",
        shippingCompanyIdFilter: shippingCompanyId,
        shippingTypeFilter: shippingType,
        statusFilters: params.getAll("status"),
        isReturnedFilter: params.get("isReturned") || "all",
        updatedByIdFilter:
          user.role === "admin" ? params.get("updatedById") || "" : "",
      }),
    );
    setReady(key);
  }, [dispatch, key]);
  useEffect(
    () => () => {
      dispatch(resetShipments(null));
    },
    [dispatch],
  );
  const scoped = {
      ...filters,
      merchantIdFilter:
        user.role === "user" ? "" : fixedUserId || filters.merchantIdFilter,
      updatedByIdFilter: user.role === "admin" ? filters.updatedByIdFilter : "",
      paymentStatusFilter:
        user.role === "user" ? [] : filters.paymentStatusFilter,
      closedInvoiceFilter:
        user.role === "user" ? "all" : filters.closedInvoiceFilter,
    },
    datesValid =
      !filters.dateFromFilter ||
      !filters.dateToFilter ||
      new Date(filters.dateFromFilter) <= new Date(filters.dateToFilter);
  const { data, currentData, isFetching, isError, refetch } =
      useGetShipmentsQuery(scoped, {
        skip:
          !allowed ||
          ready !== key ||
          !datesValid ||
          filters.viewType === "chart",
        refetchOnMountOrArgChange: true,
      }),
    [getAll] = useLazyGetShipmentsQuery(),
    [getLabel] = useLazyGetShipmentLabelQuery(),
    [getShipment] = useLazyGetShipmentQuery();
  useEffect(() => {
    if (
      currentData &&
      !isFetching &&
      filters.page >
        Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setShipmentsPage(
          Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1),
        ),
      );
  }, [currentData, isFetching, filters.page, filters.pageSize, dispatch]);
  const fields = shipmentFields(t, user, shippingCompanyId, shippingType);
  async function labels(rows: IShipment[]) {
    setError("");
    try {
      const urls: string[] = [];
      for (const row of rows.filter((item) => !!item.trackingNumber)) {
        let url = row.labelUrl;
        if (!url) {
          url = (
            await getLabel({
              shipmentId: row.id,
              trackingNumber: row.trackingNumber,
            }).unwrap()
          ).labelUrl;
          if (!url) url = (await getShipment(row.id).unwrap()).labelUrl;
        }
        if (!url)
          throw new Error(`${row.trackingNumber}: ${t("LABEL_NOT_READY")}`);
        urls.push(url);
      }
      downloadShipmentBlob(
        await mergeShipmentLabels(urls),
        "Ashamco Express Waybills.pdf",
      );
    } catch (e) {
      setError(shipmentErrorMessage(e, t("DOCUMENT_ERROR")));
    }
  }
  if (!allowed) return <Navigate to="/home" replace />;
  if (filters.viewType === "chart")
    return <ShipmentsSummaryAnalytics userId={scoped.merchantIdFilter} />;
  return (
    <div className="w-full flex flex-col h-full" data-testid="shipments-table">
      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {!datesValid && <Alert severity="error">{t("INVALID_DATE_RANGE")}</Alert>}
      <CustomTable
        fields={fields}
        data={ready === key && datesValid ? data?.results || [] : []}
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
        noDataMessage={t("NO_SHIPMENTS")}
        autoRowHeight
        estimatedRowHeight={150}
        checkboxSelection
        exportedFileName="Ashamco Express Shipments"
        onChangePagination={({ page, pageSize }) =>
          pageSize !== filters.pageSize
            ? dispatch(setShipmentsPageSize(pageSize))
            : dispatch(setShipmentsPage(page))
        }
        tableToolbarSelectionExportAllButton={
          user.role !== "user" && datesValid && ready === key
        }
        tableToolbarSelectionExportAllButtonProps={{
          onClick: async () => ({
            data: (
              await getAll({ ...scoped, page: 0, pageSize: 50000 }).unwrap()
            ).results,
            fields,
          }),
          footer: { sumField: "shipmentPrice.total", sumLabel: t("TOTAL") },
        }}
        tableToolbarSelectionButton
        tableToolbarSelectionButtonProps={{
          label: t("VIEW_SELECTED_SHIPMENTS_WAYBILL"),
          onClick: (rows) => {
            void labels(rows);
          },
          conditions: [{ id: "trackingNumber" }],
        }}
        tableToolbarSelectionButton1={canUpdateShipment(user)}
        tableToolbarSelectionButton1Props={{
          label: t("SETTLEMENT_SELECTED_MERCHANT_DUES"),
          onClick: (rows) =>
            setOperation({
              rows: structuredClone(
                rows.filter((row) => canSettleShipment(user, row)),
              ),
              operation: "settle",
            }),
          conditions: [
            { id: "isCod", equalsTo: true },
            { id: "status", notEqualsTo: "returned" },
            { id: "shipmentCod.codStatus", equalsTo: "pending" },
          ],
        }}
        tableToolbarSelectionButton2={canUpdateShipment(user)}
        tableToolbarSelectionButton2Props={{
          label: t("CONVERT_TO_DELIVEREDS"),
          onClick: (rows) =>
            setOperation({
              rows: structuredClone(rows),
              operation: "delivered",
            }),
          conditions: [
            { id: "isCod", equalsTo: false },
            { id: "status", notEqualsTo: "delivered" },
          ],
        }}
        highlighter={(row) =>
          row.returnedFromShipmentId || row.orderReturned ? "error" : undefined
        }
      />
      {operation && (
        <ShipmentOperationDialog
          {...operation}
          onClose={() => setOperation(undefined)}
        />
      )}
    </div>
  );
}
