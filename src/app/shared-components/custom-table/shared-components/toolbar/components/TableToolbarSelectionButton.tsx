import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { LoadingButton } from "@mui/lab";
import { Button } from "@mui/material";
import {
  TableDataTypes,
  TableFieldProps,
  TableToolbarSelectionButtonProps,
  customTableValueFormatter,
  customTableValueGetter,
  getFilterField,
} from "app/shared-components/custom-table/Utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import Currency from "src/app/main/utils/currencyFormatter";
import * as XLSX from "xlsx";

function TableToolbarSelectionButton<T extends object>({
  rowSelectionModel = [],
  conditions,
  data: tableData = [],
  onClick,
  size = "small",
  color = "secondary",
  variant = "contained",
  label,
  exportAllButton = false,
  loading = false,
  loadingIndicator = "",
  promiseButton,
  unrelated,
  footer,
  exportedFileName,
}: TableToolbarSelectionButtonProps<T>) {
  const { t } = useTranslation("public");
  const dispatch = useDispatch();
  const [loadingExport, setLoadingExport] = useState(false);
  const filteredRowSelectionModel = rowSelectionModel.filter(
    (row) =>
      !conditions ||
      conditions.every(
        (c) =>
          (!c.notEqualsTo || getFilterField(row, c.id) !== c.notEqualsTo) &&
          (((c.equalsTo || typeof c.equalsTo === "boolean") &&
            getFilterField(row, c.id) === c.equalsTo) ||
            (c.orEqualsTo &&
              getFilterField(row, c.orId ?? c.id) === c.orEqualsTo) ||
            (getFilterField(row, c.id) &&
              !(c.equalsTo || typeof c.equalsTo === "boolean"))),
      ),
  );
  const ButtonComponent =
    exportAllButton || promiseButton ? LoadingButton : Button;
  return (
    (filteredRowSelectionModel.length > 0 || exportAllButton || unrelated) && (
      <ButtonComponent
        {...{
          size,
          color,
          variant,
          loading: loading || loadingExport,
          loadingIndicator: loadingIndicator ?? t("PROCESSING"),
        }}
        onClick={
          exportAllButton || promiseButton
            ? () => {
                setLoadingExport(true);
                (
                  onClick(filteredRowSelectionModel) as Promise<{
                    data: (T & { id: string })[];
                    fields: TableFieldProps<T>[];
                  }>
                )
                  .then((result) => {
                    if (exportAllButton) {
                      const rows = result.data.map((item) => {
                        const row = {};
                        result.fields.forEach((field) => {
                          if (
                            !(field.exportable
                              ? !field.exportable
                              : field.type === TableDataTypes.actions
                                ? true
                                : false)
                          ) {
                            row[field.label] = customTableValueFormatter<T>(
                              field,
                              item,
                              customTableValueGetter<T>(
                                field,
                                item,
                                getFilterField(item, field.id),
                                t,
                              ),
                              tableData,
                              t,
                            );
                          }
                        });
                        return row;
                      });
                      if (footer) {
                        if (footer.sumField) {
                          const emptyRow = {};
                          result.fields.forEach((field, index) => {
                            if (
                              !(field.exportable
                                ? !field.exportable
                                : field.type === TableDataTypes.actions
                                  ? true
                                  : false)
                            ) {
                              emptyRow[field.label] = "";
                            }
                          });
                          rows.push({ ...emptyRow });
                          rows.push({ ...emptyRow });
                          const addedRow = {};
                          result.fields.forEach((field, index) => {
                            if (
                              !(field.exportable
                                ? !field.exportable
                                : field.type === TableDataTypes.actions
                                  ? true
                                  : false) &&
                              !(field.label in addedRow)
                            ) {
                              if (field.id === footer.sumField) {
                                let sum: number | string = result.data.reduce(
                                  (acc, item) =>
                                    acc +
                                    Number(
                                      getFilterField(item, footer.sumField) ??
                                        0,
                                    ),
                                  0,
                                );
                                if (!footer.sumIsNotCurrency) {
                                  sum = Currency(sum);
                                }
                                addedRow[field.label] = sum;
                                if (
                                  index > 0 ||
                                  index < result.fields.length - 1
                                ) {
                                  addedRow[
                                    result.fields[
                                      index > 0 ? index - 1 : index + 1
                                    ].label
                                  ] = footer.sumLabel ?? t("SUM");
                                }
                              } else {
                                addedRow[field.label] = "";
                              }
                            }
                          });
                          rows.push(addedRow);
                        }
                      }
                      if (footer?.countRows) {
                        const countRow = {};
                        const fields = result.fields.filter(
                          (field) =>
                            field.exportable !== false &&
                            field.type !== TableDataTypes.actions,
                        );
                        if (fields[0])
                          countRow[fields[0].label] =
                            footer.countRowsLabel ?? t("COUNT");
                        if (fields[1])
                          countRow[fields[1].label] = result.data.length;
                        rows.push(countRow);
                      }
                      const worksheet = XLSX.utils.json_to_sheet(rows);
                      const workbook = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(
                        workbook,
                        worksheet,
                        exportedFileName ?? "results",
                      );
                      XLSX.writeFile(
                        workbook,
                        `${exportedFileName ?? "results"}.xlsx`,
                      );
                    }
                    setLoadingExport(false);
                    dispatch(
                      showMessage({
                        message: exportAllButton
                          ? t("EXCEL_FILE_EXPORTED_SUCCESSFULLY")
                          : `${result}`,
                        variant: "success",
                        autoHideDuration: 2000,
                        anchorOrigin: {
                          vertical: "top",
                          horizontal: "right",
                        },
                      }),
                    );
                  })
                  .catch((message) => {
                    dispatch(
                      showMessage({
                        message:
                          `${message}` ??
                          t(
                            exportAllButton
                              ? "SOMETHING_WENT_WRONG_WHEN_GET_DATA"
                              : "SOMETHING_WENT_WRONG",
                          ),
                        variant: "error",
                        autoHideDuration: 2000,
                        anchorOrigin: {
                          vertical: "top",
                          horizontal: "right",
                        },
                      }),
                    );
                    setLoadingExport(false);
                  });
              }
            : onClick
              ? () => onClick(filteredRowSelectionModel)
              : () => {}
        }
      >
        {exportAllButton ? t("EXPORT_ALL_PAGES") : label}
      </ButtonComponent>
    )
  );
}

export default TableToolbarSelectionButton;
