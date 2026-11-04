import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Box,
  Card,
  LinearProgress,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import FuseScrollbars from "@fuse/core/FuseScrollbars";
import _ from "lodash";
import Currency from "src/app/main/utils/currencyFormatter";
import clsx from "clsx";
import moment from "moment";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import {
  DataGridPro,
  GridCellEditStopReasons,
  GridColDef,
  GridColumnResizeParams,
  GridRenderCellParams,
  GridTreeNodeWithRender,
  useGridApiRef,
} from "@mui/x-data-grid-pro";
import { FetchStatus } from "../../main/utils/dataStatus";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import EditableCell from "./shared-components/editable-cell/EditableCell";
import { LoadingButton } from "@mui/lab";
import NoRowsOverlay from "./shared-components/NoRowsOverlay";
import {
  CustomTableProps,
  EditableCellRef,
  NoRowsOverlayProps,
  TableDataTypes,
  TableToolbarProps,
  customTableValueFormatter,
  customTableValueGetter,
  getFilterField,
  getTableTranslations,
  tableDefaultLinkTarget,
} from "./Utils";
import TableToolbar from "./shared-components/toolbar/TableToolbar";
import TableActionsMenu from "./shared-components/TableActionsMenu";
import Icon from "../Icon";
import RatingView from "../RatingView";
import localeString from "src/app/main/utils/localeString";
import GroupingCell from "./shared-components/grouping-cell/GroupingCell";

function CustomTable<T extends object>({
  data,
  status = FetchStatus.loading,
  error,
  total,
  pageSizeOptions = [10, 25, 50, 100, 200],
  page = 0,
  pageSize = 10,
  noDataMessage,
  label,
  fields = [],
  onChangePagination,
  checkboxSelection = false,
  estimatedRowHeight = 100,
  autoRowHeight = false,
  hideToolbar = false,
  noCard = true,
  tableToolbarSelectionButton = false,
  tableToolbarSelectionButtonProps = {},
  tableToolbarSelectionButton1 = false,
  tableToolbarSelectionButton1Props = {},
  tableToolbarSelectionButton2 = false,
  tableToolbarSelectionButton2Props = {},
  tableToolbarSelectionExportAllButton = false,
  tableToolbarSelectionExportAllButtonProps = {},
  exportedFileName,
  paginationType = "server",
  highlighter,
  hideFooter = false,
  initialState,
  columnVisibilityModel,
  onChangeColumnVisibilityModel,
  hideResizeableIcon = false,
  onRowClick,
  onRowDoubleClick,
  treeData = false,
  getTreeDataPath = (row) =>
    row?.hierarchy?.map((item) =>
      localeString(item.name ?? item.title ?? item.label),
    ) ?? [],
  groupingColDef,
  defaultGroupingExpansionDepth,
}: CustomTableProps<T>) {
  const { t } = useTranslation("public");
  const theme = useTheme();
  const editableCellRef = useRef<EditableCellRef>(null);
  const apiRef = useGridApiRef();
  const translations = getTableTranslations(
    t,
    status === FetchStatus.error && error ? error : noDataMessage,
  );
  const [rowModesModel, setRowModesModel] = useState({});
  const [rowSelectionModel, setRowSelectionModel] = useState<any[]>([]);
  const [currentColumnVisibilityModel, setCurrentColumnVisibilityModel] =
    useState(columnVisibilityModel);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const handleColumnResize = (params: GridColumnResizeParams) => {
    if (theme.direction === "rtl") {
      // For RTL, we need to invert the width change
      const column = apiRef.current.getColumn(params.colDef.field);
      const widthDiff = params.width - column.width;
      const newWidth = column.width - widthDiff;

      // Update the column width immediately for visual feedback
      apiRef.current.setColumnWidth(params.colDef.field, newWidth);

      // Store the new width
      setColumnWidths((prev) => ({
        ...prev,
        [params.colDef.field]: newWidth,
      }));
    }
  };

  const handleColumnWidthChange = (field: string, width: number) => {
    if (theme.direction === "rtl") {
      // Prevent the default behavior in RTL mode
      return false;
    }
    // Allow normal behavior in LTR mode
    return true;
  };

  const container = {
    show: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0 },
  };
  const handleResetEditableCell = (id, field) => {
    apiRef.current.stopCellEditMode({ id, field });
  };
  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };
  useEffect(() => {
    if (status !== FetchStatus.loading) {
      setRowSelectionModel([]);
    }
  }, [status]);
  useEffect(() => {
    setCurrentColumnVisibilityModel(columnVisibilityModel);
  }, [columnVisibilityModel]);
  useEffect(() => {
    setRowSelectionModel([]);
  }, [data]);
  const noRowsOverlayProps: NoRowsOverlayProps = {
    title: noDataMessage ?? t("NO_ROWS"),
  };
  const toolbarProps: TableToolbarProps<T> = {
    tableToolbarSelectionButton,
    tableToolbarSelectionButtonProps: {
      ...tableToolbarSelectionButtonProps,
      rowSelectionModel,
      data,
    },
    tableToolbarSelectionButton1,
    tableToolbarSelectionButton1Props: {
      ...tableToolbarSelectionButton1Props,
      rowSelectionModel,
      data,
    },
    tableToolbarSelectionButton2,
    tableToolbarSelectionButton2Props: {
      ...tableToolbarSelectionButton2Props,
      rowSelectionModel,
      data,
    },
    tableToolbarSelectionExportAllButton,
    tableToolbarSelectionExportAllButtonProps: {
      ...tableToolbarSelectionExportAllButtonProps,
      rowSelectionModel,
      data,
    },
    exportedFileName,
    rowSelectionModel,
  };
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={clsx("w-full", !noCard ? "h-512" : "h-full")}
    >
      <Card
        component={motion.div}
        variants={item}
        className={clsx("w-full h-full", noCard ? "p-0 shadow-0" : "px-16")}
      >
        {label && (
          <div className="flex items-center px-32 pt-24">
            <Typography className="text-2xl font-semibold leading-tight">
              {label}
            </Typography>
          </div>
        )}
        <div className="w-full flex flex-col h-full" dir={theme.direction}>
          <FuseScrollbars className="grow overflow-x-auto">
            <DataGridPro
              apiRef={apiRef}
              treeData={treeData}
              getTreeDataPath={getTreeDataPath}
              groupingColDef={{
                headerName: t("NAME"),
                flex: 1.8,
                minWidth: 210,
                renderCell: (params) => <GroupingCell {...params} />,
                ...(groupingColDef || {}),
              }}
              defaultGroupingExpansionDepth={defaultGroupingExpansionDepth}
              className="h-full"
              initialState={initialState}
              columnVisibilityModel={currentColumnVisibilityModel}
              onColumnVisibilityModelChange={(newModel) => {
                setCurrentColumnVisibilityModel(newModel);
                onChangeColumnVisibilityModel?.(newModel);
              }}
              localeText={translations}
              slots={
                !hideToolbar && {
                  toolbar: TableToolbar,
                  noRowsOverlay: NoRowsOverlay,
                }
              }
              slotProps={{
                pagination: {
                  showFirstButton: true,
                  showLastButton: true,
                },
                noRowsOverlay: noRowsOverlayProps,
                toolbar: toolbarProps,
              }}
              rows={data}
              // onColumnResize={handleColumnResize}
              sx={{
                WebkitFontSmoothing: "auto",
                letterSpacing: "normal",
                "--DataGrid-cellOffsetMultiplier": 6,
                "& .row-app-theme--Highlighted-primary": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                  },
                },
                "& .row-app-theme--Highlighted-secondary": {
                  bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                  "&:hover": {
                    bgcolor: (theme) =>
                      alpha(theme.palette.secondary.main, 0.15),
                  },
                },
                "& .row-app-theme--Highlighted-error": {
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.05),
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  },
                },
                "& .row-app-theme--Highlighted-success": {
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.05),
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                  },
                },
                "& .row-app-theme--Highlighted-info": {
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.info.main, 0.15),
                  },
                },
                "& .row-app-theme--Highlighted-warning": {
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.warning.main, 0.15),
                  },
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  textWrap: "wrap",
                },
                "& .MuiDataGrid-columnsContainer": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "light" ? "#fafafa" : "#1d1d1d",
                },
                "& .MuiDataGrid-iconSeparator": hideResizeableIcon && {
                  display: "none",
                },
                "& .MuiDataGrid-columnHeader, .MuiDataGrid-cell": {
                  borderRight: (theme) =>
                    `1px solid ${
                      theme.palette.mode === "light" ? "#f0f0f0" : "#303030"
                    }`,
                },
                "& .MuiDataGrid-columnsContainer, .MuiDataGrid-cell": {
                  borderBottom: (theme) =>
                    `1px solid ${
                      theme.palette.mode === "light" ? "#f0f0f0" : "#303030"
                    }`,
                },
                "& .MuiDataGrid-cell": {
                  color: (theme) =>
                    theme.palette.mode === "light"
                      ? "rgba(0,0,0,.85)"
                      : "rgba(255,255,255,0.65)",
                },
                "& .MuiPaginationItem-root": {
                  borderRadius: 0,
                },
                ...(autoRowHeight
                  ? {
                      "&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell": {
                        py: "8px",
                      },
                      "&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell": {
                        py: "15px",
                      },
                      "&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell":
                        { py: "22px" },
                    }
                  : {}),
              }}
              onRowSelectionModelChange={(newRowSelectionModel, details) => {
                if (
                  !_.isEqualWith(rowSelectionModel, newRowSelectionModel) &&
                  checkboxSelection
                ) {
                  setRowSelectionModel(
                    newRowSelectionModel.map((c) =>
                      data.find((s) => s.id === c),
                    ),
                  );
                }
              }}
              rowSelectionModel={rowSelectionModel.map((c) => c.id)}
              checkboxSelection={checkboxSelection}
              disableRowSelectionOnClick={checkboxSelection}
              keepNonExistentRowsSelected={checkboxSelection}
              getRowHeight={autoRowHeight && (() => "auto")}
              getEstimatedRowHeight={
                autoRowHeight && estimatedRowHeight
                  ? () => estimatedRowHeight
                  : undefined
              }
              autoHeight={
                data && status === FetchStatus.done && data?.length > 6
              }
              getRowClassName={
                highlighter
                  ? (params) =>
                      highlighter(params.row)
                        ? `row-app-theme--Highlighted-${highlighter(params.row) === true ? "primary" : highlighter(params.row)}`
                        : undefined
                  : undefined
              }
              // getEstimatedRowHeight={() => estimatedRowHeight}
              columns={fields.map<GridColDef>((e) => {
                return {
                  field: e.id as string,
                  headerName: e.label,
                  type: "string",
                  resizable: true,
                  headerAlign:
                    e.headerAlign ??
                    (e.type === TableDataTypes.actions ||
                    e.type === TableDataTypes.order
                      ? "center"
                      : undefined),
                  align:
                    e.align ??
                    (e.chip ||
                    e.type === TableDataTypes.bool ||
                    e.type === TableDataTypes.notBool ||
                    e.type === TableDataTypes.order ||
                    e.type === TableDataTypes.icon
                      ? "center"
                      : e.type === TableDataTypes.actions
                        ? "right"
                        : "left"),
                  filterable:
                    e.filterable ??
                    (e.type === TableDataTypes.actions ||
                    e.type === TableDataTypes.icon
                      ? false
                      : true),
                  sortable:
                    e.sortable ??
                    (e.type === TableDataTypes.actions ? false : true),
                  flex:
                    e.flex ??
                    (e.type === TableDataTypes.actions
                      ? 1.2
                      : e.type === TableDataTypes.order ||
                          e.type === TableDataTypes.icon
                        ? 0.2
                        : 1),
                  disableExport: e.exportable
                    ? !e.exportable
                    : e.type === TableDataTypes.actions ||
                        e.type === TableDataTypes.icon
                      ? true
                      : false,
                  minWidth: e.minWidth
                    ? e.minWidth + 30
                    : e.type === TableDataTypes.actions
                      ? 120
                      : e.type === TableDataTypes.order ||
                          e.type === TableDataTypes.icon
                        ? 20
                        : 100,
                  valueFormatter: (value: any, row: any) =>
                    customTableValueFormatter<T>(e, row, value, data, t),
                  valueGetter: (value: any, row: any) =>
                    customTableValueGetter<T>(e, row, value, t),
                  editable: e.editable,
                  renderEditCell:
                    e.renderEditCell ??
                    ((
                      params: GridRenderCellParams<
                        T & { id: string },
                        any,
                        any,
                        GridTreeNodeWithRender
                      >,
                    ) => (
                      <EditableCell
                        ref={editableCellRef}
                        row={params.row}
                        value={params.value}
                        type={e.editType}
                        resetCell={() =>
                          handleResetEditableCell(params.row.id, e.id)
                        }
                        onConfirmEdit={e.onConfirmEdit}
                        onCancelEdit={e.onCancelEdit}
                        options={e.editOptions || []}
                        onEdit={e.onEdit}
                        inputProps={e.editInputProps}
                        disabledTitleGetter={e.editDisabledTitleGetter}
                        disabled={
                          (e.editConditions &&
                            !e.editConditions.every(
                              (c) =>
                                (!c.notEqualsTo ||
                                  getFilterField<T>(params.row, c.id) !==
                                    c.notEqualsTo) &&
                                (((c.equalsTo ||
                                  typeof c.equalsTo === "boolean") &&
                                  getFilterField<T>(params.row, c.id) ===
                                    c.equalsTo) ||
                                  (c.orEqualsTo &&
                                    getFilterField<T>(
                                      params.row,
                                      c.orId ?? c.id,
                                    ) === c.orEqualsTo) ||
                                  (getFilterField<T>(params.row, c.id) &&
                                    !(
                                      c.equalsTo ||
                                      typeof c.equalsTo === "boolean"
                                    ))),
                            )) ||
                          (e.editDisabledGetter &&
                            e.editDisabledGetter(params.row))
                        }
                      />
                    )),
                  renderCell:
                    e.renderCell ??
                    ((
                      params: GridRenderCellParams<
                        T & { id: string },
                        any,
                        any,
                        GridTreeNodeWithRender
                      >,
                    ) => {
                      if (
                        e.conditions &&
                        !e.conditions.every(
                          (c) =>
                            (!c.notEqualsTo ||
                              getFilterField<T>(params.row, c.id) !==
                                c.notEqualsTo) &&
                            (((c.equalsTo || typeof c.equalsTo === "boolean") &&
                              getFilterField<T>(params.row, c.id) ===
                                c.equalsTo) ||
                              (c.orEqualsTo &&
                                getFilterField<T>(
                                  params.row,
                                  c.orId ?? c.id,
                                ) === c.orEqualsTo) ||
                              (getFilterField<T>(params.row, c.id) &&
                                !(
                                  c.equalsTo || typeof c.equalsTo === "boolean"
                                ))),
                        )
                      ) {
                        return "";
                      }
                      if (e.type === TableDataTypes.actions) {
                        const actions = e.actions.filter(
                          (action) =>
                            !action.conditions ||
                            action.conditions.every(
                              (c) =>
                                (!c.notEqualsTo ||
                                  getFilterField<T>(params.row, c.id) !==
                                    c.notEqualsTo) &&
                                (((c.equalsTo ||
                                  typeof c.equalsTo === "boolean") &&
                                  getFilterField<T>(params.row, c.id) ===
                                    c.equalsTo) ||
                                  (c.orEqualsTo &&
                                    getFilterField<T>(
                                      params.row,
                                      c.orId ?? c.id,
                                    ) === c.orEqualsTo) ||
                                  (getFilterField<T>(params.row, c.id) &&
                                    !(
                                      c.equalsTo ||
                                      typeof c.equalsTo === "boolean"
                                    ))),
                            ),
                        );
                        return (
                          <div
                            className={
                              e.className ??
                              `w-full flex items-${
                                autoRowHeight ? "start" : "center"
                              } space-x-8 h-full justify-end`
                            }
                          >
                            {actions
                              .slice(0, e.keepItemsCount ?? 2)
                              .filter(
                                (action) =>
                                  !action.title ||
                                  action.title.length <= 8 ||
                                  action.keepOnView,
                              )
                              .map((action, index: number) => (
                                <LoadingButton
                                  key={index}
                                  component={action.link && Link}
                                  to={
                                    action.link && action.linkGetter(params.row)
                                  }
                                  target={
                                    action.link &&
                                    (action.target ?? tableDefaultLinkTarget)
                                  }
                                  role="button"
                                  className="px-8 whitespace-nowrap"
                                  variant={action.variant ?? "contained"}
                                  size={action.size ?? "small"}
                                  color={action.color ?? "primary"}
                                  onClick={() =>
                                    action.onActionClick
                                      ? action.onActionClick(params.row)
                                      : null
                                  }
                                  loading={
                                    action.loadingGetter
                                      ? action.loadingGetter(params.row)
                                      : undefined
                                  }
                                  loadingIndicator={
                                    action.loadingIndicator ?? action.title
                                  }
                                >
                                  <span>{action.title}</span>
                                </LoadingButton>
                              ))}
                            {(actions.length > (e.keepItemsCount ?? 2) ||
                              actions
                                .slice(0, e.keepItemsCount ?? 2)
                                .filter(
                                  (action: any) =>
                                    (!action.title ||
                                      action.title.length > 8) &&
                                    !action.keepOnView,
                                ).length > 0) && (
                              <TableActionsMenu
                                actions={[
                                  ...actions
                                    .slice(0, e.keepItemsCount ?? 2)
                                    .filter(
                                      (action: any) =>
                                        !action.title ||
                                        action.title.length > 8,
                                    ),
                                  ...actions.slice(
                                    e.keepItemsCount ?? 2,
                                    actions.length,
                                  ),
                                ]}
                                row={params.row}
                              />
                            )}
                          </div>
                        );
                      }
                      const dataValue = e.chip
                        ? e.toChipTitle(params.value, params.row)
                        : params.value;
                      let cellData =
                        e.type === TableDataTypes.date ? (
                          dataValue ? (
                            moment(dataValue).format(
                              e.withTime ? "DD/MM/YYYY hh:mm A" : "DD/MM/YYYY",
                            )
                          ) : (
                            e.placeholder ?? "--"
                          )
                        ) : e.type === TableDataTypes.money ? (
                          dataValue === null || dataValue === undefined ? (
                            e.placeholder ?? "--"
                          ) : (
                            `${
                              e.moneyChangesLabel && e.moneyChangesLabelGetter
                                ? e.moneyChangesLabelGetter(params.row)
                                : ""
                            }${Currency(dataValue)}`
                          )
                        ) : e.type === TableDataTypes.moneyOrPercentage ? (
                          dataValue === null || dataValue === undefined ? (
                            e.placeholder ?? "--"
                          ) : e.isMoneyGetter && e.isMoneyGetter(params.row) ? (
                            `${
                              e.moneyChangesLabel && e.moneyChangesLabelGetter
                                ? e.moneyChangesLabelGetter(params.row)
                                : ""
                            }${Currency(dataValue)}`
                          ) : (
                            `${dataValue}%`
                          )
                        ) : e.type === TableDataTypes.weight ? (
                          `${dataValue} ${t("KG")}`
                        ) : e.type === TableDataTypes.order ? (
                          <span className="font-semibold">{`${
                            data.findIndex((i) => i.id === params.row.id) + 1
                          }`}</span>
                        ) : e.type === TableDataTypes.percentage ? (
                          `${dataValue}%`
                        ) : e.type === TableDataTypes.rating ? (
                          <div
                            className={
                              e.className ??
                              "w-full flex items-center justify-center h-full py-10"
                            }
                          >
                            <RatingView ratings={dataValue} />
                          </div>
                        ) : e.type === TableDataTypes.image ? (
                          <div
                            className={
                              e.className ??
                              "w-full flex items-center justify-center h-full py-10"
                            }
                          >
                            {dataValue ? (
                              <img
                                className="rounded max-w-full max-h-full"
                                src={dataValue}
                                alt={dataValue}
                              />
                            ) : (
                              e.placeholder ?? (
                                <img
                                  className="rounded max-w-full max-h-full"
                                  src="assets/images/image-placeholder.png"
                                  alt={dataValue}
                                />
                              )
                            )}
                          </div>
                        ) : e.type === TableDataTypes.icon ? (
                          <div
                            className={
                              e.className ??
                              "w-full flex items-center justify-center h-full py-10"
                            }
                          >
                            {dataValue &&
                            dataValue.split("-").length === 2 &&
                            dataValue.split("-").every((e) => !!e) ? (
                              <Icon
                                type={dataValue.split("-")[0]}
                                name={dataValue.split("-")[1]}
                              />
                            ) : (
                              e.placeholder
                            )}
                          </div>
                        ) : (
                          dataValue
                        );
                      if (e.link && e.linkGetter(params.row)) {
                        cellData = (
                          <Link
                            to={e.linkGetter(params.row)}
                            target={e.target ?? tableDefaultLinkTarget}
                          >
                            {cellData}
                          </Link>
                        );
                      }
                      return e.type === TableDataTypes.progress ||
                        e.type === TableDataTypes.progressWithLabel ? (
                        <div className="flex items-center justify-center h-full w-full">
                          <Box
                            sx={{
                              width: "100%",
                              mr:
                                e.type === TableDataTypes.progressWithLabel
                                  ? 1
                                  : undefined,
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={params.value}
                            />
                          </Box>
                          {e.type === TableDataTypes.progressWithLabel && (
                            <Box sx={{ minWidth: 35 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >{`${Math.round(params.value)}%`}</Typography>
                            </Box>
                          )}
                        </div>
                      ) : e.type === TableDataTypes.bool ||
                        e.type === TableDataTypes.notBool ? (
                        (
                          e.type === TableDataTypes.bool ? cellData : !cellData
                        ) ? (
                          <FuseSvgIcon className="text-green inline" size={20}>
                            heroicons-outline:check-circle
                          </FuseSvgIcon>
                        ) : (
                          <FuseSvgIcon className="text-red inline" size={20}>
                            heroicons-outline:minus-circle
                          </FuseSvgIcon>
                        )
                      ) : e.chip ? (
                        <Box
                          component="div"
                          sx={{
                            bgcolor: e.chipSolidColor
                              ? e.toChipColor(params.value, params.row)
                              : e.chipThemeColor &&
                                ((theme) =>
                                  theme.palette[
                                    e.toChipColor(params.value, params.row)
                                  ].main),
                            color: (theme) =>
                              e.type === TableDataTypes.money &&
                              e.moneyChangesColor &&
                              e.moneyChangesColorGetter &&
                              e.moneyChangesColorGetter(params.row)
                                ? theme.palette[
                                    e.moneyChangesColorGetter(params.row)
                                  ].main
                                : "white",
                          }}
                          className={clsx(
                            "text-12 font-semibold py-4 px-12 rounded-full text-white",
                            !e.chipThemeColor &&
                              !e.chipSolidColor &&
                              e.toChipColor(params.value, params.row),
                            !e.flexChip
                              ? autoRowHeight
                                ? "inline-block whitespace-nowrap"
                                : "inline whitespace-nowrap"
                              : "",
                          )}
                        >
                          {cellData}
                        </Box>
                      ) : e.type === TableDataTypes.money &&
                        e.moneyChangesColor &&
                        e.moneyChangesColorGetter ? (
                        <Box
                          component="div"
                          className="inline"
                          sx={{
                            color: (theme) =>
                              e.type === TableDataTypes.money &&
                              e.moneyChangesColor &&
                              e.moneyChangesColorGetter &&
                              e.moneyChangesColorGetter(params.row)
                                ? theme.palette[
                                    e.moneyChangesColorGetter(params.row)
                                  ].main
                                : "white",
                          }}
                        >
                          {cellData}
                        </Box>
                      ) : e.dir || e.className ? (
                        <div dir={e.dir} className={e.className}>
                          {cellData}
                        </div>
                      ) : (
                        cellData
                      );
                    }),
                };
              })}
              loading={status === FetchStatus.loading}
              rowCount={total ?? 0}
              pagination={!hideFooter}
              pageSizeOptions={pageSizeOptions}
              paginationModel={{ page, pageSize }}
              paginationMode={paginationType}
              onPaginationModelChange={onChangePagination}
              hideFooter={hideFooter}
              rowModesModel={rowModesModel}
              onRowModesModelChange={handleRowModesModelChange}
              onRowClick={onRowClick}
              onRowDoubleClick={onRowDoubleClick}
              onCellEditStop={(params, event) => {
                if (params.reason === GridCellEditStopReasons.enterKeyDown) {
                  event.defaultMuiPrevented = true;
                } else if (
                  params.reason === GridCellEditStopReasons.cellFocusOut &&
                  editableCellRef.current
                ) {
                  event.defaultMuiPrevented =
                    editableCellRef.current.handleConfirm();
                }
              }}
            />
          </FuseScrollbars>
        </div>
      </Card>
    </motion.div>
  );
}

export default CustomTable;
