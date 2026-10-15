import CustomAnalytic from "../custom-analytic/CustomAnalytic";
import CustomTable from "../custom-table/CustomTable.jsx";
import CustomGrid from "../custom-grid/CustomGrid";

export const viewSwitcherIconTypes = {
  table: "table",
  grid: "grid",
  chart: "chart",
};

export const toViewSwitcherIconTitle = (type) => {
  switch (type) {
    case viewSwitcherIconTypes.grid:
      return "GRID_VIEW";
    case viewSwitcherIconTypes.table:
      return "TABLE_VIEW";

    case viewSwitcherIconTypes.chart:
      return "CHART_VIEW";
  }
  return "TABLE_VIEW";
};
export const toViewSwitcherIconName = (type) => {
  switch (type) {
    case viewSwitcherIconTypes.grid:
      return "hi-HiViewGrid";
    case viewSwitcherIconTypes.table:
      return "fa6-FaTableColumns";
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
  return CustomTable;
};
