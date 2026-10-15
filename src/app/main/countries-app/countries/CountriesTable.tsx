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
import ICountry from "../models/ICountry";
import { GetCountriesApiArg, useGetCountriesQuery } from "../CountriesApi";
import {
  newCountriesInstance,
  resetCountries,
  selectCountriesFilters,
  setCountriesPage,
  setCountriesPageSize,
} from "../store/countriesSlice";
import ChangeNamingConfigDialog from "./ChangeNamingConfigDialog";
import { countriesPath, displayName } from "../Utils";
export default function CountriesTable() {
  const { shippingCompanyId = "all" } = useParams();
  const filters = useSelector(selectCountriesFilters) as GetCountriesApiArg;
  const [ready, setReady] = useState<string>();
  const { t } = useTranslation("countriesApp");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    dispatch(
      newCountriesInstance({ shippingCompanyIdFilter: shippingCompanyId }),
    );
    setReady(shippingCompanyId);
  }, [dispatch, shippingCompanyId]);
  useEffect(
    () => () => {
      dispatch(resetCountries(null));
    },
    [dispatch],
  );
  const { data, isFetching, isError, refetch } = useGetCountriesQuery(filters, {
    skip: ready !== shippingCompanyId,
    refetchOnMountOrArgChange: true,
  });
  const fields: TableFieldProps<ICountry>[] = [
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
      id: "code",
      label: t("CODE"),
      type: TableDataTypes.normal,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "dialCode",
      label: t("DIAL_CODE"),
      type: TableDataTypes.normal,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "shipmentCountries",
      label: t("SHIPPING_COMPANIES"),
      type: TableDataTypes.normal,
      valueGetter: (row) => row.shipmentCountries?.length || 0,
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
          title: t("VIEW"),
          color: "secondary",
          onActionClick: (row) =>
            navigate(
              `${countriesPath(filters.shippingCompanyIdFilter)}/${row.id}`,
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
                children: <ChangeNamingConfigDialog country={row} />,
              }),
            ),
        },
        {
          title: t("VIEW_STATES"),
          color: "primary",
          onActionClick: (row) =>
            navigate(
              `/states/${filters.shippingCompanyIdFilter || "all"}/${row.id}`,
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
          {t("SOMETHING_WENT_WRONG_WHEN_GET_COUNTRIES")}
        </Alert>
      )}
      <CustomTable<ICountry>
        fields={fields}
        status={
          isError
            ? FetchStatus.error
            : ready !== shippingCompanyId || isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        error={
          isError ? t("SOMETHING_WENT_WRONG_WHEN_GET_COUNTRIES") : undefined
        }
        data={(data?.results || []).filter(
          (country) =>
            !filters.shippingCompanyIdFilter ||
            filters.shippingCompanyIdFilter === "all" ||
            country.shipmentCountries?.some(
              (row) =>
                row.shippingCompanyId === filters.shippingCompanyIdFilter,
            ),
        )}
        total={data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setCountriesPageSize(pageSize));
          else dispatch(setCountriesPage(page));
        }}
        checkboxSelection
        noDataMessage={t("NO_COUNTRIES")}
        exportedFileName="Ashamco Express - Countries"
      />
    </div>
  );
}
