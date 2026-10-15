import { Box, Button, ButtonProps, useTheme } from "@mui/material";
import {
  gridFilteredDescendantCountLookupSelector,
  GridRenderCellParams,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid-pro";
import Icon from "app/shared-components/Icon";

function GroupingCell(props: GridRenderCellParams) {
  const { id, field, rowNode, value } = props;
  const theme = useTheme();
  const apiRef = useGridApiContext();
  const filteredDescendantCountLookup = useGridSelector(
    apiRef,
    gridFilteredDescendantCountLookupSelector
  );
  const filteredDescendantCount =
    filteredDescendantCountLookup[rowNode.id] ?? 0;

  const handleClick: ButtonProps["onClick"] = (event) => {
    if (rowNode.type !== "group") {
      return;
    }

    apiRef.current.setRowChildrenExpansion(id, !rowNode.childrenExpanded);
    apiRef.current.setCellFocus(id, field);
    event.stopPropagation();
  };
  return (
    <Box
      sx={{ ml: (rowNode.depth - 1) * 5 + 2 }}
      className="flex items-stretch"
    >
      <div className="py-8">
        <Box
          className="border-s border-dashed h-full"
          sx={{
            width: "30px",
            borderColor: (theme) => theme.palette.primary.main,
          }}
        ></Box>
      </div>
      <div>
        <Button
          onClick={
            rowNode.type === "group" ? handleClick : (e) => e.stopPropagation()
          }
          tabIndex={-1}
          color="primary"
          //   variant={rowNode.type === "group" ? "contained" : "outlined"}
          variant={"outlined"}
          size="small"
          className="text-14 font-semibold"
          startIcon={
            rowNode.type === "group" && (
              <Icon
                type="fa6"
                name={
                  rowNode.childrenExpanded
                    ? "FaAngleDown"
                    : theme.direction === "rtl"
                      ? "FaAngleLeft"
                      : "FaAngleRight"
                }
                size="0.8em"
              />
            )
          }
        >
          {/* See {filteredDescendantCount} employees */}
          {`${value}${rowNode.type === "group" ? ` (${filteredDescendantCount})` : ""}`}
        </Button>
      </div>
    </Box>
  );
}

export default GroupingCell;
