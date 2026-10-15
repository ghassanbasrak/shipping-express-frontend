import CustomAnalytic from "../custom-analytic/CustomAnalytic";
import CustomTable from "../custom-table/CustomTable.js";
import CustomGrid from "../custom-grid/CustomGrid";

export interface ViewSwitcherIconsProps {
  selectedViewType: "table" | "grid" | "calendar" | "chart";
  onSelectViewType: (type: "table" | "grid" | "calendar" | "chart") => void;
  viewTypes?: string[];
  iconColor?:
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "error";
  iconSize?: string;
  iconButtonSize?: "small" | "medium" | "large";
}

export const viewSwitcherIconTypes = {
  table: "table",
  grid: "grid",
  calendar: "calendar",
  chart: "chart",
};

export const toViewSwitcherIconTitle = (type) => {
  switch (type) {
    case viewSwitcherIconTypes.grid:
      return "GRID_VIEW";
    case viewSwitcherIconTypes.table:
      return "TABLE_VIEW";
    case viewSwitcherIconTypes.calendar:
      return "CALENDAR_VIEW";

    case viewSwitcherIconTypes.chart:
      return "CHART_VIEW";
  }
  return "TABLE_VIEW";
};
export const toViewSwitcherIconName = (type) => {
  switch (type) {
    case viewSwitcherIconTypes.grid:
      return "fa6-FaGrip";
    case viewSwitcherIconTypes.table:
      return "fa6-FaTableColumns";
    case viewSwitcherIconTypes.calendar:
      return "fa6-FaCalendarDays";
    case viewSwitcherIconTypes.chart:
      return "fa6-FaChartColumn";
  }
  return "fa6-FaTableColumns";
};
export const toViewSwitcherIconComponent = (type) => {
  switch (type) {
    case viewSwitcherIconTypes.grid:
      return CustomGrid;
    case viewSwitcherIconTypes.table:
      return CustomTable;
    case viewSwitcherIconTypes.chart:
      return CustomAnalytic;
  }
  return null;
};
