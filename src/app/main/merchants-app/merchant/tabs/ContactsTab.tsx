import { useEffect, useState } from "react";
import { Alert, Button, Input, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { FetchStatus } from "../../../utils/dataStatus";
import localeString from "../../../utils/localeString";
import IShipmentUser from "../../../shipment-users-app/models/IShipmentUser";
import {
  useGetMerchantContactsQuery,
  useLazyGetMerchantContactsQuery,
} from "../../MerchantsApi";
export default function ContactsTab({
  merchantId,
  type,
}: {
  merchantId: string;
  type: string;
}) {
  const { t } = useTranslation("shipmentUsersApp"),
    [page, setPage] = useState(0),
    [pageSize, setPageSize] = useState(10),
    [search, setSearch] = useState(""),
    [from, setFrom] = useState<Date>(),
    [to, setTo] = useState<Date>();
  const invalid =
      (from && !Number.isFinite(from.getTime())) ||
      (to && !Number.isFinite(to.getTime())) ||
      (from && to && from > to),
    scope = {
      userId: merchantId,
      type,
      page,
      pageSize,
      searchText: search,
      ...(from && Number.isFinite(from.getTime())
        ? { dateFromFilter: from.toISOString() }
        : {}),
      ...(to && Number.isFinite(to.getTime())
        ? { dateToFilter: to.toISOString() }
        : {}),
    },
    query = useGetMerchantContactsQuery(scope, {
      skip: !merchantId || !!invalid,
      refetchOnMountOrArgChange: true,
    }),
    [getAll] = useLazyGetMerchantContactsQuery();
  useEffect(() => {
    if (
      query.currentData &&
      !query.isFetching &&
      page > Math.max(0, Math.ceil(query.currentData.total / pageSize) - 1)
    )
      setPage(Math.max(0, Math.ceil(query.currentData.total / pageSize) - 1));
  }, [query.currentData, query.isFetching, page, pageSize]);
  const fields: TableFieldProps<IShipmentUser>[] = [
    {
      id: "fullName",
      label: t("FULL_NAME"),
      type: TableDataTypes.normal,
      flex: 1.2,
      minWidth: 120,
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
      id: "address",
      label: t("ADDRESS"),
      type: TableDataTypes.normal,
      flex: 1.2,
      minWidth: 120,
      valueGetter: (row) =>
        [
          localeString(row.country?.name || row.address?.country?.name),
          localeString(row.state?.name || row.address?.state?.name),
          localeString(row.city?.name || row.address?.city?.name),
          row.address?.street,
        ]
          .filter(Boolean)
          .join(", "),
    },
    {
      id: "senderShipmentsCount",
      label: t("SHIPMENTS"),
      type: TableDataTypes.normal,
      flex: 0.6,
      minWidth: 60,
      valueGetter: (row) =>
        row[
          type === "sender" ? "senderShipmentsCount" : "receiverShipmentsCount"
        ] || 0,
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
    <div className="space-y-16 min-h-512" data-testid="merchant-contacts">
      <div className="flex flex-wrap items-center gap-8">
        <Typography variant="h6">
          {t(type === "sender" ? "SENDERS" : "RECEIVERS")}
        </Typography>
        <FilterIcon
          filters={[
            {
              type: FilterTypes.dateTime,
              title: t("START_DATE"),
              value: from || null,
              maxDate: to,
              onChange: (value) => {
                setFrom(value);
                setPage(0);
              },
              disableTime: true,
              closeOnChange: false,
            },
            {
              type: FilterTypes.dateTime,
              title: t("END_DATE"),
              value: to || null,
              minDate: from,
              onChange: (value) => {
                setTo(value);
                setPage(0);
              },
              disableTime: true,
              closeOnChange: false,
            },
          ]}
          componentProps={{
            children: <FuseSvgIcon>heroicons-outline:filter</FuseSvgIcon>,
          }}
        />
        <Paper className="px-16">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder={t("SEARCH_SHIPMENT_USERS")}
            inputProps={{ "data-testid": "merchant-contacts-search" }}
          />
        </Paper>
      </div>
      {invalid && (
        <Alert severity="error">
          {t("INVALID_DATE_RANGE", { ns: "merchantsApp" })}
        </Alert>
      )}
      {query.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => query.refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<IShipmentUser>
        fields={fields}
        data={query.data?.results || []}
        total={query.data?.total || 0}
        page={page}
        pageSize={pageSize}
        status={
          query.isError || invalid
            ? FetchStatus.error
            : query.isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        autoRowHeight
        checkboxSelection
        exportedFileName="Ashamco - Merchant Contacts"
        onChangePagination={(value) => {
          setPage(value.pageSize !== pageSize ? 0 : value.page);
          setPageSize(value.pageSize);
        }}
        tableToolbarSelectionExportAllButton
        tableToolbarSelectionExportAllButtonProps={{
          onClick: async () => {
            if (invalid) throw new Error("Invalid dates");
            const result = await getAll({
              ...scope,
              page: 0,
              pageSize: 50000,
            }).unwrap();
            return { data: result.results, fields };
          },
        }}
      />
    </div>
  );
}
