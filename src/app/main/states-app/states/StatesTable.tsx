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
import IState from "../models/IState";
import { GetStatesApiArg, useGetStatesQuery } from "../StatesApi";
import {
  newStatesInstance,
  resetStates,
  selectStatesFilters,
  setStatesPage,
  setStatesPageSize,
} from "../store/statesSlice";
import ChangeNamingConfigDialog from "./ChangeNamingConfigDialog";
import { statesPath, displayName } from "../Utils";
export default function StatesTable() {
  const { shippingCompanyId = "all", countryId = "all" } = useParams();
  const routeKey = `${shippingCompanyId}/${countryId}`;
  const filters = useSelector(selectStatesFilters) as GetStatesApiArg;
  const [ready, setReady] = useState<string>();
  const { t } = useTranslation("statesApp");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    dispatch(
      newStatesInstance({
        shippingCompanyIdFilter: shippingCompanyId,
        countryIdFilter: countryId,
      }),
    );
    setReady(routeKey);
  }, [dispatch, shippingCompanyId, countryId, routeKey]);
  useEffect(
    () => () => {
      dispatch(resetStates(null));
    },
    [dispatch],
  );
  const { data, isFetching, isError, refetch } = useGetStatesQuery(filters, {
    skip: ready !== routeKey,
    refetchOnMountOrArgChange: true,
  });
  const fields: TableFieldProps<IState>[] = [
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
      id: "shipmentStates",
      label: t("SHIPPING_COMPANIES"),
      type: TableDataTypes.normal,
      valueGetter: (row) => row.shipmentStates?.length || 0,
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
              `${statesPath(filters.shippingCompanyIdFilter, filters.countryIdFilter)}/${row.id}`,
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
                children: <ChangeNamingConfigDialog state={row} />,
              }),
            ),
        },
        {
          title: t("VIEW_CITIES"),
          color: "primary",
          onActionClick: (row) =>
            navigate(
              `/cities/${filters.shippingCompanyIdFilter || "all"}/${row.id}`,
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
          {t("SOMETHING_WENT_WRONG_WHEN_GET_STATES")}
        </Alert>
      )}
      <CustomTable<IState>
        fields={fields}
        status={
          isError
            ? FetchStatus.error
            : ready !== routeKey || isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        error={isError ? t("SOMETHING_WENT_WRONG_WHEN_GET_STATES") : undefined}
        data={(data?.results || []).filter(
          (state) =>
            !filters.shippingCompanyIdFilter ||
            filters.shippingCompanyIdFilter === "all" ||
            state.shipmentStates?.some(
              (row) =>
                row.shippingCompanyId === filters.shippingCompanyIdFilter,
            ),
        )}
        total={data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setStatesPageSize(pageSize));
          else dispatch(setStatesPage(page));
        }}
        checkboxSelection
        noDataMessage={t("NO_STATES")}
        exportedFileName="Ashamco Express - States"
      />
    </div>
  );
}
