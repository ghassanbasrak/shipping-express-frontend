import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { Alert, Button, LinearProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import {
  GetMerchantDuesApiArg,
  useGetMerchantDuesQuery,
  useLazyGetMerchantDuesQuery,
} from "../MerchantDuesApi";
import {
  canViewMerchantDues,
  canUpdateMerchantDues,
  canSettleMerchantDue,
  toMerchantDue,
  toMerchantDueShipment,
  datesValid,
} from "../Utils";
import {
  selectMerchantDuesFilters,
  newMerchantDuesInstance,
  resetMerchantDues,
  setMerchantDuesPage,
  setMerchantDuesPageSize,
} from "../store/merchantDuesSlice";
import merchantDueFields from "../shared-components/MerchantDueFields";
import IMerchantDue from "../models/IMerchantDue";
import IShipment from "../../shipments-app/models/IShipment";
import { ShipmentOperationDialog } from "../../shipments-app/shared-components/ShipmentOperations";
import {
  downloadShipmentBlob,
  mergeShipmentLabels,
} from "../../shipments-app/shared-components/documents";
import { shipmentErrorMessage } from "../../shipments-app/Utils";
export default function MerchantDuesTable({
  fixedUserId,
}: { fixedUserId?: string } = {}) {
  const { t } = useTranslation("merchantDuesApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    location = useLocation(),
    { shippingCompanyId = "all", userId = fixedUserId || "all" } = useParams(),
    filters = useSelector(selectMerchantDuesFilters) as GetMerchantDuesApiArg,
    [ready, setReady] = useState(""),
    [error, setError] = useState(""),
    [printing, setPrinting] = useState(false),
    [settling, setSettling] = useState<IShipment[]>();
  const key = `${shippingCompanyId}/${userId}/${user.id}/${user.role}/${location.search}`,
    allowed = canViewMerchantDues(user);
  useEffect(() => {
    dispatch(
      newMerchantDuesInstance({
        instanceKey: key,
        shippingCompanyIdFilter: shippingCompanyId,
        userIdFilter: user.role === "user" ? "all" : userId,
        updatedByIdFilter:
          user.role === "admin"
            ? new URLSearchParams(location.search).get("updatedById") || ""
            : "",
      }),
    );
    setReady(key);
    setSettling(undefined);
  }, [dispatch, key]);
  useEffect(
    () => () => {
      dispatch(resetMerchantDues(null));
    },
    [dispatch],
  );
  const scoped = {
      ...filters,
      userIdFilter:
        user.role === "user" ? "all" : fixedUserId || filters.userIdFilter,
      updatedByIdFilter: user.role === "admin" ? filters.updatedByIdFilter : "",
      shipmentReceiverIdFilter:
        user.role === "user" ? filters.shipmentReceiverIdFilter : "",
    },
    valid = datesValid(filters);
  const { data, currentData, isFetching, isError, refetch } =
      useGetMerchantDuesQuery(scoped, {
        skip: !allowed || ready !== key || !valid,
        refetchOnMountOrArgChange: true,
      }),
    [getAll] = useLazyGetMerchantDuesQuery();
  useEffect(() => {
    if (
      currentData &&
      !isFetching &&
      filters.page >
        Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setMerchantDuesPage(
          Math.max(0, Math.ceil(currentData.total / filters.pageSize) - 1),
        ),
      );
  }, [currentData, isFetching, filters.page, filters.pageSize, dispatch]);
  const rows = useMemo(
      () => (data?.results || []).map(toMerchantDue).filter(Boolean),
      [data?.results],
    ),
    fields = merchantDueFields(t, user);
  async function labels(values: IMerchantDue[]) {
    if (printing) return;
    setError("");
    setPrinting(true);
    try {
      const rows = values.filter(
        (row) => row.shipment?.status !== "returned" && row.shipment?.labelUrl,
      );
      downloadShipmentBlob(
        await mergeShipmentLabels(rows.map((row) => row.shipment.labelUrl)),
        "Ashamco COD Waybills.pdf",
      );
    } catch (e) {
      setError(shipmentErrorMessage(e, t("DOCUMENT_ERROR")));
    } finally {
      setPrinting(false);
    }
  }
  if (!allowed) return <Navigate to="/home" replace />;
  return (
    <div
      className="w-full flex flex-col h-full"
      data-testid="merchant-dues-table"
    >
      {printing && <LinearProgress />}
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
      {!valid && <Alert severity="error">{t("INVALID_DATE_RANGE")}</Alert>}
      <CustomTable
        fields={fields}
        data={ready === key && valid ? rows : []}
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
        noDataMessage={t("NO_MERCHANT_DUES")}
        autoRowHeight
        estimatedRowHeight={100}
        checkboxSelection
        exportedFileName="Ashamco Merchant Dues"
        onChangePagination={({ page, pageSize }) =>
          pageSize !== filters.pageSize
            ? dispatch(setMerchantDuesPageSize(pageSize))
            : dispatch(setMerchantDuesPage(page))
        }
        tableToolbarSelectionExportAllButton={
          user.role !== "user" && valid && ready === key
        }
        tableToolbarSelectionExportAllButtonProps={{
          onClick: async () => ({
            data: (
              await getAll({ ...scoped, page: 0, pageSize: 50000 }).unwrap()
            ).results
              .map(toMerchantDue)
              .filter(Boolean),
            fields,
          }),
          footer: {
            sumField: "codPrice",
            sumLabel: t("TOTAL"),
            countRows: true,
            countRowsLabel: t("SHIPMENTS_COUNT"),
          },
        }}
        tableToolbarSelectionButton
        tableToolbarSelectionButtonProps={{
          label: t("VIEW_SELECTED_SHIPMENTS_WAYBILL"),
          onClick: (rows) => {
            void labels(rows);
          },
          conditions: [
            { id: "shipment.status", notEqualsTo: "returned" },
            { id: "shipment.labelUrl" },
          ],
        }}
        tableToolbarSelectionButton1={canUpdateMerchantDues(user)}
        tableToolbarSelectionButton1Props={{
          label: t("SETTLEMENT_SELECTED_MERCHANT_DUES"),
          onClick: (rows) =>
            setSettling(
              rows
                .filter((row) => canSettleMerchantDue(user, row))
                .map((row) => toMerchantDueShipment(structuredClone(row))),
            ),
          conditions: [
            { id: "shipment.status", notEqualsTo: "returned" },
            { id: "codStatus", equalsTo: "pending" },
          ],
        }}
      />
      {settling && (
        <ShipmentOperationDialog
          rows={settling}
          operation="settle"
          permissionFeature="merchant-dues"
          onClose={() => setSettling(undefined)}
        />
      )}
    </div>
  );
}
