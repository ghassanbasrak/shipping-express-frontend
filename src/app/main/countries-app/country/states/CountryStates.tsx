import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Alert, Button, TextField, Typography } from "@mui/material";
import FusePageCarded from "@fuse/core/FusePageCarded";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import {
  useGetCountryQuery,
  useGetCountryStatesQuery,
} from "../../CountriesApi";
import { GetCountryStatesApiResponse } from "../../CountriesApi";
type CountryState = GetCountryStatesApiResponse["results"][number];
import { countriesPath, displayName } from "../../Utils";
export default function CountryStates() {
  const { countryId, shippingCompanyId = "all" } = useParams();
  const { t } = useTranslation("countriesApp");
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
  const [searchText, setSearchText] = useState("");
  const country = useGetCountryQuery(countryId);
  const query = useGetCountryStatesQuery({
    countryId,
    shippingCompanyId,
    ...pagination,
    searchText,
  });
  const fields: TableFieldProps<CountryState>[] = [
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
      id: "createdAt",
      label: t("CREATED_AT"),
      type: TableDataTypes.date,
      flex: 0.7,
      minWidth: 70,
    },
  ];
  return (
    <FusePageCarded
      header={
        <div className="w-full p-24 flex flex-wrap justify-between items-center gap-16">
          <div>
            <Button
              component={Link}
              to={`${countriesPath(shippingCompanyId)}/${countryId}`}
            >
              {t("GO_TO_COUNTRIES")}
            </Button>
            <Typography className="text-24 font-bold">
              {t("STATE_PREVIEW")} — {displayName(country.data?.name)}
            </Typography>
          </div>
          <TextField
            size="small"
            label={t("SEARCH_STATES")}
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPagination({ ...pagination, page: 0 });
            }}
          />
        </div>
      }
      content={
        <div className="w-full h-full">
          {query.isError && (
            <Alert
              severity="error"
              action={
                <Button onClick={() => query.refetch()}>{t("RETRY")}</Button>
              }
            >
              {t("SOMETHING_WENT_WRONG")}
            </Alert>
          )}
          <CustomTable<CountryState>
            fields={fields}
            data={query.data?.results || []}
            total={query.data?.total || 0}
            {...pagination}
            onChangePagination={(model) => setPagination(model)}
            status={
              query.isError
                ? FetchStatus.error
                : query.isFetching
                  ? FetchStatus.loading
                  : FetchStatus.done
            }
            noDataMessage={t("NO_STATES")}
          />
        </div>
      }
    />
  );
}
