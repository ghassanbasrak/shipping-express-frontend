import { useEffect, useMemo, useState } from "react";
import { Alert, Button } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { FetchStatus } from "../../utils/dataStatus";
import {
  GetMerchantsApiArg,
  useGetMerchantsQuery,
  useLazyGetMerchantsQuery,
} from "../MerchantsApi";
import IMerchant from "../models/IMerchant";
import {
  canViewMerchants,
  canAdjustMerchantBalance,
  canConvertMerchant,
  merchantDatesInvalid,
  merchantName,
  toMerchantVerificationStatusTitle,
  toMerchantVerificationStatusColor,
} from "../Utils";
import {
  selectMerchantsFilters,
  newMerchantsInstance,
  resetMerchants,
  setMerchantsPage,
  setMerchantsPageSize,
  setMerchantsBalanceSorting,
  setMerchantsCodBalanceSorting,
} from "../store/merchantsSlice";
import MerchantActionDialog from "../shared-components/MerchantActionDialog";
export default function MerchantsTable() {
  const { t } = useTranslation("merchantsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    filters = useSelector(selectMerchantsFilters) as GetMerchantsApiArg,
    [ready, setReady] = useState(false),
    [selected, setSelected] = useState<IMerchant>();
  useEffect(() => {
    dispatch(newMerchantsInstance(null));
    setReady(true);
    return () => {
      dispatch(resetMerchants(null));
    };
  }, [dispatch]);
  const permitted = canViewMerchants(user),
    invalidDates = merchantDatesInvalid(filters),
    query = useGetMerchantsQuery(filters, {
      skip: !permitted || !ready || invalidDates,
      refetchOnMountOrArgChange: true,
    }),
    [getAll] = useLazyGetMerchantsQuery();
  useEffect(() => {
    if (
      query.currentData &&
      !query.isFetching &&
      filters.page >
        Math.max(0, Math.ceil(query.currentData.total / filters.pageSize) - 1)
    )
      dispatch(
        setMerchantsPage(
          Math.max(
            0,
            Math.ceil(query.currentData.total / filters.pageSize) - 1,
          ),
        ),
      );
  }, [
    query.currentData,
    query.isFetching,
    filters.page,
    filters.pageSize,
    dispatch,
  ]);
  const rows = useMemo(
    () =>
      query.data?.results.map((row) =>
        row.id
          ? row
          : { ...row, id: (row as IMerchant & { _id?: string })._id },
      ) || [],
    [query.data],
  );
  const fields: TableFieldProps<IMerchant>[] = [
    {
      id: "firstName",
      label: t("FULL_NAME"),
      type: TableDataTypes.normal,
      valueGetter: merchantName,
      flex: 1.2,
      minWidth: 120,
      link: true,
      linkGetter: (row) => `/merchants/${row.id}/view`,
    },
    {
      id: "email",
      label: t("EMAIL"),
      type: TableDataTypes.normal,
      flex: 0.9,
      minWidth: 90,
    },
    {
      id: "phone",
      label: t("PHONE_NUMBER"),
      type: TableDataTypes.normal,
      flex: 0.9,
      minWidth: 90,
      valueGetter: (row) => [row.phone, row.phone1].filter(Boolean).join(" / "),
    },
    {
      id: "balance",
      label: t("BALANCE"),
      type: TableDataTypes.money,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "codBalance",
      label: t("COD_BALANCE"),
      type: TableDataTypes.money,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "shipmentsCount",
      label: t("SHIPMENTS"),
      type: TableDataTypes.normal,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "isBlocked",
      label: t("IS_BLOCKED"),
      valueGetter: (row) => t(row.isBlocked ? "YES" : "NO"),
      type: TableDataTypes.normal,
      flex: 0.3,
      minWidth: 30,
    },
    {
      id: "isRegistered",
      label: t("IS_REGISTERED"),
      valueGetter: (row) => t(row.isRegistered ? "YES" : "NO"),
      type: TableDataTypes.normal,
      flex: 0.3,
      minWidth: 30,
    },
    {
      id: "verificationStatus",
      label: t("VERIFICATION_STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toMerchantVerificationStatusTitle(value)),
      toChipColor: toMerchantVerificationStatusColor,
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
      flex: 1.2,
      minWidth: 120,
      exportable: false,
      actions: [
        {
          title: t("VIEW"),
          color: "secondary",
          link: true,
          linkGetter: (row) => `/merchants/${row.id}/view`,
        },
        ...(canAdjustMerchantBalance(user)
          ? [
              {
                title: t("EDIT_BALANCE"),
                link: true,
                linkGetter: (row: IMerchant) =>
                  `/transactions/${row.id}/all/new`,
              },
            ]
          : []),
        ...(canConvertMerchant(user)
          ? [
              {
                title: t("CONVERT_TO_EMPLOYEE"),
                onActionClick: (row: IMerchant) =>
                  setSelected(structuredClone(row)),
              },
            ]
          : []),
      ],
    },
  ];
  if (!permitted) return <Navigate to="/home" replace />;
  return (
    <div className="w-full flex flex-col h-full" data-testid="merchants-table">
      <div className="flex flex-wrap gap-8 p-8">
        <Button
          data-testid="sort-wallet"
          onClick={() =>
            dispatch(
              setMerchantsBalanceSorting(
                filters.balanceSorting === "asc"
                  ? "desc"
                  : filters.balanceSorting === "desc"
                    ? ""
                    : "asc",
              ),
            )
          }
        >
          {t("BALANCE")}: {filters.balanceSorting || t("ALL")}
        </Button>
        <Button
          data-testid="sort-cod"
          onClick={() =>
            dispatch(
              setMerchantsCodBalanceSorting(
                filters.codBalanceSorting === "asc"
                  ? "desc"
                  : filters.codBalanceSorting === "desc"
                    ? ""
                    : "asc",
              ),
            )
          }
        >
          {t("COD_BALANCE")}: {filters.codBalanceSorting || t("ALL")}
        </Button>
      </div>
      {invalidDates && (
        <Alert severity="error">{t("INVALID_DATE_RANGE")}</Alert>
      )}
      {query.isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => query.refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<IMerchant>
        fields={fields}
        data={rows}
        total={query.data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        status={
          query.isError || invalidDates
            ? FetchStatus.error
            : !ready || query.isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        noDataMessage={t("NO_MERCHANTS")}
        autoRowHeight
        estimatedRowHeight={130}
        checkboxSelection
        exportedFileName="Ashamco - Merchants"
        onChangePagination={({ page, pageSize }) =>
          pageSize !== filters.pageSize
            ? dispatch(setMerchantsPageSize(pageSize))
            : dispatch(setMerchantsPage(page))
        }
        tableToolbarSelectionExportAllButton
        tableToolbarSelectionExportAllButtonProps={{
          onClick: async () => {
            if (invalidDates) throw new Error(t("INVALID_DATE_RANGE"));
            const result = await getAll({
              ...filters,
              page: 0,
              pageSize: 3000,
            }).unwrap();
            return { data: result.results, fields };
          },
        }}
      />
      {selected && (
        <MerchantActionDialog
          action="convert"
          merchant={selected}
          onClose={() => setSelected(undefined)}
        />
      )}
    </div>
  );
}
