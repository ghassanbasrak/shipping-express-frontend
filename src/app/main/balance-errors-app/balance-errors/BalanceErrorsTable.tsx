import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { FetchStatus } from "../../utils/dataStatus";
import { useLazyGetBalanceErrorsQuery } from "../BalanceErrorsApi";
import {
  BalanceErrorsFilters,
  balanceErrorsSchema,
} from "../models/BalanceErrorsSchema";
import IBalanceError from "../models/IBalanceError";
import {
  BalanceErrorRow,
  canViewBalanceErrors,
  balanceErrorToday,
  balanceErrorRows,
  balanceErrorNumber,
  balanceErrorApiDate,
  balanceErrorDate,
  toBalanceErrorStatusTitle,
  toBalanceErrorStatusColor,
} from "../Utils";
import BalanceErrorDetailsDialog from "../shared-components/BalanceErrorDetailsDialog";
export default function BalanceErrorsTable() {
  const { t } = useTranslation("balanceErrorsApp"),
    user = useAppSelector(selectUser),
    allowed = canViewBalanceErrors(user),
    methods = useForm<BalanceErrorsFilters>({
      defaultValues: {
        dateFrom: balanceErrorToday(),
        dateTo: balanceErrorToday(),
      },
      resolver: zodResolver(balanceErrorsSchema(t)),
      mode: "onChange",
    }),
    [getReport, query] = useLazyGetBalanceErrorsQuery(),
    [report, setReport] = useState<{
      range: BalanceErrorsFilters;
      rows: BalanceErrorRow[];
    }>(),
    [failed, setFailed] = useState<BalanceErrorsFilters>(),
    [page, setPage] = useState(0),
    [pageSize, setPageSize] = useState(10),
    [selected, setSelected] = useState<IBalanceError>(),
    locked = useRef(false);
  const load = async (range: BalanceErrorsFilters) => {
    if (!allowed || locked.current) return;
    locked.current = true;
    setFailed(undefined);
    const snapshot = { ...range };
    try {
      const result = await getReport(
        {
          dateFrom: balanceErrorApiDate(snapshot.dateFrom),
          dateTo: balanceErrorApiDate(snapshot.dateTo),
        },
        false,
      ).unwrap();
      setReport({ range: snapshot, rows: balanceErrorRows(result) });
      setPage(0);
      setSelected(undefined);
    } catch {
      setFailed(snapshot);
    } finally {
      locked.current = false;
    }
  };
  const fields: TableFieldProps<BalanceErrorRow>[] = [
    {
      id: "transaction.user.email",
      label: t("MERCHANT_NAME"),
      type: TableDataTypes.normal,
      valueGetter: (row) => row.transaction.user?.email || t("UNKNOWN"),
      flex: 0.9,
      minWidth: 90,
    },
    {
      id: "transaction.transactionNumber",
      label: t("TRANSACTION_ID"),
      type: TableDataTypes.normal,
      valueGetter: (row) => balanceErrorNumber(row.transaction) || t("N_A"),
      flex: 1.1,
      minWidth: 110,
    },
    {
      id: "transaction.amount",
      label: t("AMOUNT"),
      type: TableDataTypes.money,
      valueGetter: (row) => row.transaction.amount ?? 0,
      moneyChangesColor: true,
      moneyChangesColorGetter: (row) =>
        row.transaction.amount < 0 ? "error" : "success",
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "transaction.hasRepeatedBalance",
      label: t("STATUS"),
      type: TableDataTypes.normal,
      chip: true,
      flexChip: true,
      valueGetter: (row) => row.transaction.hasRepeatedBalance,
      toChipTitle: (_, row) =>
        t(toBalanceErrorStatusTitle(row.transaction.hasRepeatedBalance)),
      toChipColor: (_, row) =>
        toBalanceErrorStatusColor(row.transaction.hasRepeatedBalance),
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "transaction.createdAt",
      label: t("DATE"),
      type: TableDataTypes.normal,
      valueGetter: (row) =>
        balanceErrorDate(row.transaction.createdAt) || t("N_A"),
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "actions",
      label: t("ACTIONS"),
      type: TableDataTypes.normal,
      flex: 1.1,
      minWidth: 110,
      exportable: false,
      renderCell: ({ row }) => (
        <Button
          size="small"
          onClick={() => setSelected(structuredClone(row.transaction))}
          data-testid={`view-${row.id}`}
        >
          {t(row.transaction.hasRepeatedBalance ? "VIEW_ERROR" : "VIEW")}
        </Button>
      ),
    },
  ];
  if (!allowed) return <Navigate to="/home" replace />;
  return (
    <div
      className="p-16 sm:p-24 space-y-24 w-full"
      data-testid="balance-errors-table"
    >
      <FormProvider {...methods}>
        <Card>
          <CardContent>
            <Typography className="text-20 font-semibold mb-16">
              {t("FILTER_BY_DATES")}
            </Typography>
            <form
              onSubmit={methods.handleSubmit(load)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-16 items-start"
              noValidate
            >
              {(["dateFrom", "dateTo"] as const).map((name) => (
                <Controller
                  key={name}
                  name={name}
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="date"
                      label={t(name === "dateFrom" ? "FROM" : "TO")}
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      inputProps={{ "data-testid": `balance-${name}` }}
                    />
                  )}
                />
              ))}
              <LoadingButton
                type="submit"
                loading={query.isFetching}
                variant="contained"
                data-testid="search-balance-errors"
              >
                {t("SEARCH")}
              </LoadingButton>
            </form>
          </CardContent>
        </Card>
      </FormProvider>
      {failed && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => load(failed)} disabled={query.isFetching}>
              {t("RETRY")}
            </Button>
          }
        >
          {t(report ? "LOAD_ERROR_RETAINED" : "LOAD_ERROR")}
        </Alert>
      )}
      {report && (
        <Typography data-testid="balance-result-range">
          {t("RESULTS_FOR")}: {balanceErrorApiDate(report.range.dateFrom)} –{" "}
          {balanceErrorApiDate(report.range.dateTo)}
        </Typography>
      )}
      <Typography className="text-20 font-semibold">
        {t("TRANSACTIONS")} ({report?.rows.length || 0})
      </Typography>
      {!report && !query.isFetching ? (
        <Typography>{t("SEARCH_TO_LOAD")}</Typography>
      ) : (
        <CustomTable<BalanceErrorRow>
          fields={fields}
          data={report?.rows || []}
          total={report?.rows.length || 0}
          status={query.isFetching ? FetchStatus.loading : FetchStatus.done}
          noDataMessage={t("NO_ERRORS_FOUND")}
          paginationType="client"
          page={page}
          pageSize={pageSize}
          hideToolbar
          autoRowHeight
          onChangePagination={({ page, pageSize }) => {
            setPage(page);
            setPageSize(pageSize);
          }}
        />
      )}
      {selected && (
        <BalanceErrorDetailsDialog
          transaction={selected}
          onClose={() => setSelected(undefined)}
        />
      )}
    </div>
  );
}
