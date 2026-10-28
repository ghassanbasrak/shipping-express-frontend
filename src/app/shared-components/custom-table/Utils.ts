import { TFunction } from "i18next";
import Currency from "src/app/main/utils/currencyFormatter";
import moment from "moment";
import {
  GridCallbackDetails,
  GridColumnVisibilityModel,
  GridEventListener,
  GridGroupingColDefOverride,
  GridPaginationModel,
  GridRenderCellParams,
  GridTreeNodeWithRender,
} from "@mui/x-data-grid-pro";
import { ReactNode, SyntheticEvent } from "react";
import { CheckboxProps, InputBaseProps, SelectProps } from "@mui/material";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import localeString from "src/app/main/utils/localeString";
import { GridInitialStatePro } from "@mui/x-data-grid-pro/models/gridStatePro";
import { LocaleString } from "src/app/main/utils/commonTypes";

export enum TableDataTypes {
  normal,
  money,
  weight,
  percentage,
  moneyOrPercentage,
  date,
  bool,
  notBool,
  image,
  icon,
  progress,
  progressWithLabel,
  order,
  rating,
  actions,
}

export const customTableValueGetter = <T>(
  field: TableFieldProps<T>,
  row: T,
  value: any,
  t: TFunction,
) => {
  const resolvedValue =
    value === undefined ? getFilterField(row, field.id) : value;
  return field.valueGetter
    ? field.valueGetter(row)
    : field.locale
      ? localeString(resolvedValue ?? { en: "", ar: "" })
      : resolvedValue;
};

export const customTableValueFormatter = <T>(
  field: TableFieldProps<T>,
  row: T & { id: string },
  value: any,
  data: (T & { id: string })[],
  t: TFunction,
) => {
  return field.valueFormatter
    ? field.valueFormatter(row)
    : field.type === TableDataTypes.image
      ? ""
      : field.type === TableDataTypes.money
        ? value === null || value === undefined
          ? field.placeholder ?? "--"
          : `${
              field.moneyChangesLabel && field.moneyChangesLabelGetter
                ? field.moneyChangesLabelGetter(row)
                : ""
            }${Currency(value)}`
        : field.type === TableDataTypes.moneyOrPercentage
          ? value === null || value === undefined
            ? field.placeholder ?? "--"
            : field.isMoneyGetter && field.isMoneyGetter(row)
              ? `${
                  field.moneyChangesLabel && field.moneyChangesLabelGetter
                    ? field.moneyChangesLabelGetter(row)
                    : ""
                }${Currency(value)}`
              : `${value ?? ""}%`
          : field.type === TableDataTypes.percentage ||
              field.type === TableDataTypes.progress ||
              field.type === TableDataTypes.progressWithLabel
            ? `${value ?? ""}%`
            : field.type === TableDataTypes.weight
              ? `${value ?? ""} ${t("KG")}`
              : field.type === TableDataTypes.order
                ? `${data.findIndex((i) => i.id === row.id) + 1}`
                : field.type === TableDataTypes.date
                  ? value
                    ? moment(value).format("DD/MM/YYYY")
                    : field.placeholder ?? "--"
                  : field.type === TableDataTypes.actions
                    ? ""
                    : field.chip
                      ? field.toChipTitle(value, row)
                      : value;
};

export function getFilterField<T>(row: T, id: string) {
  let value: any = row;
  for (const key of id.split(".")) {
    if (value === null || value === undefined) return undefined;
    value = value[key];
  }
  return value;
}

export const tableDefaultLinkTarget = "_self";

export const getTableTranslations = (t: TFunction, noDataMessage?: string) => {
  return {
    noRowsLabel: noDataMessage ?? t("NO_ROWS"),
    noResultsOverlayLabel: t("NO_RESULTS_FOUND"),
    toolbarFiltersLabel: t("SHOW_FILTERS"),
    toolbarFiltersTooltipHide: t("HIDE_FILTERS"),
    toolbarFiltersTooltipShow: t("SHOW_FILTERS"),

    filterOperatorContains: t("cONTAINS"),
    filterOperatorEquals: t("eQUALS"),
    filterOperatorStartsWith: t("sTART_WITH"),
    filterOperatorEndsWith: t("eND_WITH"),
    filterOperatorIs: t("iS"),
    filterOperatorNot: t("iS_NOT"),
    filterOperatorAfter: t("iS_AFTER"),
    filterOperatorOnOrAfter: t("iS_ON_OR_AFTER"),
    filterOperatorBefore: t("iS_BEFORE"),
    filterOperatorOnOrBefore: t("iS_ON_OR_BEFORE"),
    filterOperatorIsEmpty: t("iS_EMPTY"),
    filterOperatorIsNotEmpty: t("iS_NOT_EMPTY"),
    filterOperatorIsAnyOf: t("iS_ANY_OF"),
    filterPanelInputPlaceholder: t("FILTER_VALUE"),
    footerRowSelected: (count: number) =>
      count !== 1
        ? `${count.toLocaleString()} ${t("rOWS_SELECTED")}`
        : `${count.toLocaleString()} ${t("rOW_SELECTED")}`,
    checkboxSelectionHeaderName: t("CHECKBOX_SELECTION"),
    toolbarColumns: t("COLUMNS"),
    toolbarColumnsLabel: t("COLUMNS"),
    columnsPanelTextFieldLabel: t("FIND_COLUMN"),
    columnsPanelTextFieldPlaceholder: t("COLUMN_TITLE"),
    columnsPanelShowAllButton: t("SHOW_ALL"),
    columnsPanelHideAllButton: t("HIDE_ALL"),
    columnHeaderSortIconLabel: t("SORT"),

    columnMenuLabel: t("MENU"),
    columnMenuShowColumns: t("SHOW_COLUMNS"),
    columnMenuManageColumns: t("MANAGE_COLUMNS"),
    columnMenuFilter: t("FILTER"),
    columnMenuHideColumn: t("HIDE_COLUMN"),
    columnMenuUnsort: t("UNSORT"),
    columnMenuSortAsc: t("SORT_BY_ASC"),
    columnMenuSortDesc: t("SORT_BY_DESC"),

    toolbarFilters: t("FILTERS"),
    filterPanelColumns: t("COLUMNS"),
    filterPanelInputLabel: t("VALUE"),
    filterPanelOperator: t("OPERATOR"),

    toolbarDensity: t("DENSITY"),
    toolbarDensityLabel: t("DENSITY"),
    toolbarDensityCompact: t("COMPACT"),
    toolbarDensityStandard: t("STANDARD"),
    toolbarDensityComfortable: t("COMFORTABLE"),

    toolbarExport: t("EXPORT"),
    toolbarExportLabel: t("EXPORT"),
    toolbarExportCSV: t("DOWNLOAD_AS_CSV"),
    toolbarExportPrint: t("PRINT"),
    toolbarExportExcel: t("DOWNLOAD_AS_EXCEL"),
    MuiTablePagination: {
      labelDisplayedRows: ({
        from,
        to,
        count,
      }: {
        from: number;
        to: number;
        count: number;
      }) => {
        return `${from}–${to} ${t("oF")} ${
          count !== -1 ? count : `${t("mORE_THAN")} ${to}`
        }`;
      },
      labelRowsPerPage: t("ROWS_PER_PAGE"),
    },
  };
};

interface ConditionProps {
  id: string;
  orId?: string;
  equalsTo?: any;
  orEqualsTo?: any;
  notEqualsTo?: any;
}

export interface ActionProps<T> {
  title: string;
  onActionClick?: (row: T) => void;
  link?: boolean;
  linkGetter?: (row: T) => string;
  conditions?: ConditionProps[];
  keepOnView?: boolean;
  target?: "_blank" | "_self" | "_parent" | "_top" | string;
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  color?:
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success"
    | "inherit";
  loadingGetter?: (row: T) => boolean;
  loadingIndicator?: string;
}

type IsTuple<T extends ReadonlyArray<any>> = number extends T["length"]
  ? false
  : true;
type TupleKeys<T extends ReadonlyArray<any>> = Exclude<keyof T, keyof any[]>;
type ArrayKey = number;
type Primitive = null | undefined | string | number | boolean | symbol | bigint;
type BrowserNativeObject = Date | FileList | File;
type IsEqual<T1, T2> = T1 extends T2
  ? (<G>() => G extends T1 ? 1 : 2) extends <G>() => G extends T2 ? 1 : 2
    ? true
    : false
  : false;
type AnyIsEqual<T1, T2> = T1 extends T2
  ? IsEqual<T1, T2> extends true
    ? true
    : never
  : never;
type PathImpl<K extends string | number, V, TraversedTypes> = V extends
  | Primitive
  | BrowserNativeObject
  ? `${K}`
  : true extends AnyIsEqual<TraversedTypes, V>
    ? `${K}`
    : `${K}` | `${K}.${PathInternal<V, TraversedTypes | V>}`;
type PathInternal<T, TraversedTypes = T> =
  T extends ReadonlyArray<infer V>
    ? IsTuple<T> extends true
      ? {
          [K in TupleKeys<T>]-?: PathImpl<K & string, T[K], TraversedTypes>;
        }[TupleKeys<T>]
      : PathImpl<ArrayKey, V, TraversedTypes>
    : {
        [K in keyof T]-?: PathImpl<K & string, T[K], TraversedTypes>;
      }[keyof T];
type Path<T> = T extends any ? PathInternal<T> : never;
type FieldPath<TFieldValues> = Path<TFieldValues>;
export interface TableFieldProps<T> {
  id: FieldPath<T> | "actions";
  label?: string;
  type: TableDataTypes;
  muiType?: string;
  valueGetter?: (row: T) => any;
  valueFormatter?: (row: T) => string;
  link?: boolean;
  linkGetter?: (row: T) => string;
  target?: "_blank" | "_self" | "_parent" | "_top" | string;
  chip?: boolean;
  toChipTitle?: (value: string, row: T) => string;
  toChipColor?: (value: string, row: T) => string;
  infoIconGetter?: (row: T) => boolean;
  infoContentGetter?: (row: T) => ReactNode;
  chipSolidColor?: boolean;
  chipThemeColor?: boolean;
  flexChip?: boolean;
  flex?: number;
  minWidth?: number;
  align?: "left" | "center" | "right";
  headerAlign?: "left" | "center" | "right";
  filterable?: boolean;
  sortable?: boolean;
  exportable?: boolean;
  placeholder?: string;
  moneyChangesLabel?: boolean;
  moneyChangesLabelGetter?: (row: T) => string;
  moneyChangesColor?: boolean;
  moneyChangesColorGetter?: (row: T) => string;
  isMoneyGetter?: (row: T) => boolean;
  locale?: boolean;
  renderCell?: (
    params: GridRenderCellParams<T, any, any, GridTreeNodeWithRender>,
  ) => ReactNode;
  conditions?: ConditionProps[];
  actions?: ActionProps<T>[];
  className?: string;
  keepItemsCount?: number;
  dir?: "ltr" | "rtl" | "auto";
  editable?: boolean;
  editType?: "textfield" | "dropdown" | "checkbox";
  renderEditCell?: (
    params: GridRenderCellParams<T, any, any, GridTreeNodeWithRender>,
  ) => ReactNode;
  onConfirmEdit?: (newValue: any, row: T) => Promise<void>;
  onCancelEdit?: (row: T) => void;
  editOptions?: { value: any; label: string }[];
  onEdit?: (newValue: any, row: T) => void;
  editInputProps?: InputBaseProps | SelectProps | CheckboxProps;
  editDisabledTitleGetter?: (row: T) => string;
  editConditions?: ConditionProps[];
  editDisabledGetter?: (row: T) => boolean;
  withTime?: boolean;
}

export interface CustomTableProps<T> {
  data: (T & { id: string })[];
  status?: FetchStatus;
  error?: string;
  total?: number;
  pageSizeOptions?: number[];
  page?: number;
  pageSize?: number;
  noDataMessage?: string;
  label?: string;
  fields: TableFieldProps<T>[];
  onChangePagination?: (
    model: GridPaginationModel,
    details: GridCallbackDetails<any>,
  ) => void;
  checkboxSelection?: boolean;
  estimatedRowHeight?: number;
  autoRowHeight?: boolean;
  hideToolbar?: boolean;
  noCard?: boolean;
  tableToolbarSelectionButton?: boolean;
  tableToolbarSelectionButtonProps?: TableToolbarSelectionButtonProps<T>;
  tableToolbarSelectionButton1?: boolean;
  tableToolbarSelectionButton1Props?: TableToolbarSelectionButtonProps<T>;
  tableToolbarSelectionButton2?: boolean;
  tableToolbarSelectionButton2Props?: TableToolbarSelectionButtonProps<T>;
  tableToolbarSelectionExportAllButton?: boolean;
  tableToolbarSelectionExportAllButtonProps?: TableToolbarSelectionButtonProps<T>;
  exportedFileName?: string;
  paginationType?: "client" | "server";
  highlighter?: (
    row: T,
  ) =>
    | "primary"
    | "secondary"
    | "error"
    | "success"
    | "info"
    | "warning"
    | true
    | false;
  hideFooter?: boolean;
  initialState?: GridInitialStatePro;
  columnVisibilityModel?: GridColumnVisibilityModel;
  onChangeColumnVisibilityModel?: (newModel: GridColumnVisibilityModel) => void;
  hideResizeableIcon?: boolean;
  onRowClick?: GridEventListener<"rowClick">;
  onRowDoubleClick?: GridEventListener<"rowDoubleClick">;
  treeData?: boolean;
  getTreeDataPath?: (row: any) => string[];
  groupingColDef?: GridGroupingColDefOverride<T>;
  defaultGroupingExpansionDepth?: number;
}

export interface NoRowsOverlayProps {
  title: string;
}

export interface TableToolbarProps<T> {
  tableToolbarSelectionButton?: boolean;
  tableToolbarSelectionButtonProps?: TableToolbarSelectionButtonProps<T>;
  tableToolbarSelectionButton1?: boolean;
  tableToolbarSelectionButton1Props?: TableToolbarSelectionButtonProps<T>;
  tableToolbarSelectionButton2?: boolean;
  tableToolbarSelectionButton2Props?: TableToolbarSelectionButtonProps<T>;
  tableToolbarSelectionExportAllButton?: boolean;
  tableToolbarSelectionExportAllButtonProps?: TableToolbarSelectionButtonProps<T>;
  exportedFileName?: string;
  rowSelectionModel?: T[];
}

export interface TableToolbarSelectionButtonProps<T> {
  rowSelectionModel?: T[];
  conditions?: ConditionProps[];
  data?: (T & { id: string })[];
  onClick?: (
    selectedRows: T[],
  ) => void | Promise<{ data: T[]; fields: TableFieldProps<T>[] }>;
  size?: "small" | "medium" | "large";
  color?:
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success"
    | "inherit";
  variant?: "text" | "outlined" | "contained";
  label?: string;
  exportAllButton?: boolean;
  loading?: boolean;
  loadingIndicator?: string;
  promiseButton?: boolean;
  unrelated?: boolean;
  exportedFileName?: string;
  footer?: {
    sumField?: string;
    sumIsNotCurrency?: boolean;
    sumLabel?: string;
    countRows?: boolean;
    countRowsLabel?: string;
  };
}

export interface TableActionsMenuProps<T> {
  actions: ActionProps<T>[];
  row: T;
}

export enum EditableCellTypes {
  textfield,
  dropdown,
  checkbox,
}

export type EditableCellProps<T extends keyof typeof EditableCellTypes> = {
  row: any;
  value: T extends "textfield" ? string : T extends "checkbox" ? boolean : any;
  resetCell: () => void;
  onConfirmEdit: (
    newValue: T extends "textfield"
      ? string
      : T extends "checkbox"
        ? boolean
        : any,
    row: any,
  ) => Promise<void>;
  onCancelEdit?: (row: any) => void;
  type: T;
  options?: T extends "dropdown" ? { value: any; label: string }[] : undefined;
  onEdit?: (
    newValue: T extends "textfield"
      ? string
      : T extends "checkbox"
        ? boolean
        : any,
    row: any,
  ) => void;
  inputProps?: T extends "textfield"
    ? InputBaseProps
    : T extends "dropdown"
      ? SelectProps
      : any;
  disabled?: boolean;
  disabledTitleGetter?: (row: any) => string;
};

export interface FieldEditableCellProps {
  ref?: any;
  defaultValue?: any;
  editValue?: any;
  loading: boolean;
  disabled: boolean;
  handleCancel: (event?: SyntheticEvent<any>) => void;
  inputProps?: any;
}

export interface EditableCellRef {
  handleConfirm: (event?: SyntheticEvent<any>) => boolean;
}

export interface HierarchyTableFieldProps<T>
  extends TableFieldProps<
    T & {
      hierarchy: { label: LocaleString; value: string; index: number }[];
    }
  > {}
