import { alpha, useTheme } from "@mui/material";
import { TableToolbarProps } from "../../Utils";
import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
} from "@mui/x-data-grid-pro";
import TableToolbarSelectionButton from "./components/TableToolbarSelectionButton";

function TableToolbar<T extends object>({
  tableToolbarSelectionButton,
  tableToolbarSelectionButtonProps,
  tableToolbarSelectionButton1,
  tableToolbarSelectionButton1Props,
  tableToolbarSelectionButton2,
  tableToolbarSelectionButton2Props,
  tableToolbarSelectionExportAllButton,
  tableToolbarSelectionExportAllButtonProps,
  exportedFileName,
  rowSelectionModel,
}: TableToolbarProps<T>) {
  const theme = useTheme();
  return (
    <GridToolbarContainer
      className="flex items-center justify-between"
      sx={
        (tableToolbarSelectionButton || tableToolbarSelectionButton1) &&
        (rowSelectionModel?.length ?? 0) > 0
          ? { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }
          : undefined
      }
    >
      <div className="flex">
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport
          csvOptions={{
            fileName: exportedFileName ?? "results",
            utf8WithBom: true,
          }}
          printOptions={{
            includeCheckboxes: false,
            hideToolbar: true,
            pageStyle: `.MuiDataGrid-root .MuiDataGrid-main { direction: ${theme.direction}; color: rgba(0, 0, 0, 0.87); }`,
          }}
        />
      </div>
      <div className="flex items-center space-x-8">
        {tableToolbarSelectionExportAllButton && (
          <TableToolbarSelectionButton
            {...tableToolbarSelectionExportAllButtonProps}
            exportAllButton
            exportedFileName={exportedFileName}
          />
        )}
        {tableToolbarSelectionButton && (
          <TableToolbarSelectionButton {...tableToolbarSelectionButtonProps} />
        )}
        {tableToolbarSelectionButton1 && (
          <TableToolbarSelectionButton {...tableToolbarSelectionButton1Props} />
        )}
        {tableToolbarSelectionButton2 && (
          <TableToolbarSelectionButton {...tableToolbarSelectionButton2Props} />
        )}
      </div>
    </GridToolbarContainer>
  );
}

export default TableToolbar;
