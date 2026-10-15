import { TablePagination, TablePaginationProps } from "@mui/material";
import { useTranslation } from "react-i18next";

function TranslatedTablePagination({
  className,
  component,
  count,
  rowsPerPage,
  page,
  backIconButtonProps,
  nextIconButtonProps,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
  rowsPerPageTranslation,
}: TablePaginationProps & { rowsPerPageTranslation?: string }) {
  const { t } = useTranslation("public");

  const labelDisplayedRows = ({ from, to, count }): string => {
    return `${from}–${to} ${t("oF")} ${
      count !== -1 ? count : `${t("mORE_THAN")} ${to}`
    }`;
  };
  const labelRowsPerPage = rowsPerPageTranslation ?? t("ROWS_PER_PAGE");

  return (
    <TablePagination
      className={className}
      component={component}
      count={count}
      rowsPerPage={rowsPerPage}
      page={page}
      backIconButtonProps={backIconButtonProps}
      nextIconButtonProps={nextIconButtonProps}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      rowsPerPageOptions={rowsPerPageOptions}
      labelDisplayedRows={labelDisplayedRows}
      labelRowsPerPage={labelRowsPerPage}
    />
  );
}

export default TranslatedTablePagination;
