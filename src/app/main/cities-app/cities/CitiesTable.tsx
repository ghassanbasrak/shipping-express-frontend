import RemoveCityDialog from "../shared-components/dialogs/RemoveCityDialog";
import { Alert, Button } from "@mui/material";
import { useAppDispatch } from "app/store/hooks";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import ICity from "../models/ICity";
import {
  GetCitiesApiArg,
  useGetCitiesQuery,
  useLazyGetCitiesQuery,
} from "../CitiesApi";
import {
  newCitiesInstance,
  resetCities,
  selectCitiesFilters,
  setCitiesPage,
  setCitiesPageSize,
} from "../store/citiesSlice";
import ChangeNamingConfigDialog from "./ChangeNamingConfigDialog";
import { citiesPath, displayName } from "../Utils";
export default function CitiesTable() {
  const { shippingCompanyId = "all", stateId = "all" } = useParams();
  const routeKey = `${shippingCompanyId}/${stateId}`;
  const filters = useSelector(selectCitiesFilters) as GetCitiesApiArg;
  const [ready, setReady] = useState<string>();
  const { t } = useTranslation("citiesApp");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [getAllCities] = useLazyGetCitiesQuery();
  useEffect(() => {
    dispatch(
      newCitiesInstance({
        shippingCompanyIdFilter: shippingCompanyId,
        stateIdFilter: stateId,
      }),
    );
    setReady(routeKey);
  }, [dispatch, shippingCompanyId, stateId, routeKey]);
  useEffect(
    () => () => {
      dispatch(resetCities(null));
    },
    [dispatch],
  );
  const { data, isFetching, isError, refetch } = useGetCitiesQuery(filters, {
    skip: ready !== routeKey,
    refetchOnMountOrArgChange: true,
  });
  const fields: TableFieldProps<ICity>[] = [
    {
      id: "name",
      label: t("NAME"),
      type: TableDataTypes.normal,
      locale: true,
      valueGetter: (row) => displayName(row.name),
      flex: 1,
      minWidth: 100,
    },
    {
      id: "countryId",
      label: t("COUNTRY"),
      type: TableDataTypes.normal,
      valueGetter: (row) => displayName(row.country?.name),
      link: true,
      linkGetter: (row) => `/countries/all/${row.countryId}`,
      flex: 1,
      minWidth: 100,
    },
    {
      id: "stateId",
      label: t("STATE"),
      type: TableDataTypes.normal,
      valueGetter: (row) => displayName(row.state?.name),
      link: true,
      linkGetter: (row) =>
        `/states/all/${row.countryId || "all"}/${row.stateId}`,
      flex: 1,
      minWidth: 100,
    },
    {
      id: "postalCode",
      label: t("ZIP_CODE"),
      type: TableDataTypes.normal,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "shipmentCities",
      label: t("SHIPPING_COMPANIES"),
      type: TableDataTypes.normal,
      valueGetter: (row) => row.shipmentCities?.length || 0,
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
      actions: [
        {
          title: t("REMOVE"),
          color: "error",
          onActionClick: (row) =>
            dispatch(openDialog({ children: <RemoveCityDialog city={row} /> })),
        },
        {
          title: t("VIEW"),
          color: "secondary",
          onActionClick: (row) =>
            navigate(
              `${citiesPath(filters.shippingCompanyIdFilter, filters.stateIdFilter)}/${row.id}`,
            ),
        },
        {
          title: t("EDIT_NAMES"),
          color: "success",
          onActionClick: (row) =>
            dispatch(
              openDialog({
                fullWidth: true,
                maxWidth: "md",
                children: <ChangeNamingConfigDialog city={row} />,
              }),
            ),
        },
      ],
    },
  ];
  return (
    <div className="w-full flex flex-col h-full">
      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("SOMETHING_WENT_WRONG_WHEN_GET_CITIES")}
        </Alert>
      )}
      <CustomTable<ICity>
        fields={fields}
        status={
          isError
            ? FetchStatus.error
            : ready !== routeKey || isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        error={isError ? t("SOMETHING_WENT_WRONG_WHEN_GET_CITIES") : undefined}
        data={(data?.results || []).filter(
          (city) =>
            !filters.shippingCompanyIdFilter ||
            filters.shippingCompanyIdFilter === "all" ||
            city.shipmentCities?.some(
              (row) =>
                row.shippingCompanyId === filters.shippingCompanyIdFilter,
            ),
        )}
        total={data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setCitiesPageSize(pageSize));
          else dispatch(setCitiesPage(page));
        }}
        tableToolbarSelectionExportAllButton
        tableToolbarSelectionExportAllButtonProps={{
          onClick: async () => {
            const response = await getAllCities({
              ...filters,
              page: 0,
              pageSize: 100000,
            }).unwrap();
            const data = response.results.filter(
              (city) =>
                !filters.shippingCompanyIdFilter ||
                filters.shippingCompanyIdFilter === "all" ||
                city.shipmentCities?.some(
                  (row) =>
                    row.shippingCompanyId === filters.shippingCompanyIdFilter,
                ),
            );
            const exportedFields: TableFieldProps<ICity>[] = [...fields];
            if (
              filters.shippingCompanyIdFilter &&
              filters.shippingCompanyIdFilter !== "all"
            )
              exportedFields.splice(1, 0, {
                id: "shipmentCities.0.name",
                label: t("COMPANY_NAME"),
                type: TableDataTypes.normal,
                valueGetter: (row) =>
                  row.shipmentCities?.find(
                    (mapping) =>
                      mapping.shippingCompanyId ===
                      filters.shippingCompanyIdFilter,
                  )?.name || "",
                flex: 1,
                minWidth: 100,
              });
            return { data, fields: exportedFields };
          },
        }}
        checkboxSelection
        noDataMessage={t("NO_CITIES")}
        exportedFileName="Ashamco Express - Cities"
      />
    </div>
  );
}
