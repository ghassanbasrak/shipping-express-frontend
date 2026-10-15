import { motion } from "framer-motion";
import { Badge, BadgeProps, IconButton, Menu, styled } from "@mui/material";
import DropdownFilterField from "./fields/DropdownFilterField";
import MultiCheckboxFilterField from "./fields/MultiCheckboxFilterField";
import { useMemo, useState } from "react";
import clsx from "clsx";
import InputFilterField from "./fields/InputFilterField";
import AutocompleteFilterField from "./fields/AutocompleteFilterField";
import DateTimeFilterField from "./fields/DateTimeFilterField";
import MultiChoiceFilterField from "./fields/MultiChoiceFilterField";

import { FilterIconProps, FilterTypes } from "./Utils";
import Icon from "../Icon";
const StyledBadge = styled(Badge)<BadgeProps>(({ theme, variant }) => ({
  "& .MuiBadge-badge": {
    top: 5,
    right: 5,
    border:
      variant === "dot"
        ? undefined
        : `2px solid ${theme.palette.background.paper}`,
    padding: "0 4px",
  },
}));
function FilterIcon<T extends object>({
  filters = [],
  component,
  componentProps,
  menuItemClassName = "w-320",
  menuLabelClassName = "min-w-96",
  badgeVariant = "standard",
  badgeColor = "info",
  changesCount = 0,
}: FilterIconProps<T>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  function getFilterElement(type: FilterTypes): React.ComponentType<any> {
    switch (type) {
      case FilterTypes.input:
        return InputFilterField;
      case FilterTypes.autocomplete:
        return AutocompleteFilterField;
      case FilterTypes.dropdown:
        return DropdownFilterField;
      case FilterTypes.multiCheckbox:
        return MultiCheckboxFilterField;
      case FilterTypes.dateTime:
        return DateTimeFilterField;
      case FilterTypes.multiChoice:
        return MultiChoiceFilterField;
      default:
        return InputFilterField;
    }
  }
  const props = componentProps ?? {
    color: "primary",
    children: <Icon type="fa6" name="FaFilter" size="0.8em" />,
  };

  const Component = component ?? IconButton;

  return (
    <div>
      <StyledBadge
        color={badgeColor}
        variant={badgeVariant}
        badgeContent={changesCount}
        invisible={changesCount === 0}
      >
        <Component {...props} onClick={handleFilterClick} />
      </StyledBadge>

      <Menu
        id="filters-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        {useMemo(
          () =>
            filters.map((filter, index) => {
              const FilterElement = getFilterElement(filter.type);
              return (
                <motion.div
                  key={index}
                  className={clsx("mx-8 my-8", menuItemClassName)}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
                >
                  <FilterElement
                    {...filter}
                    handleCloseMenu={handleCloseMenu}
                    titleClassName={menuLabelClassName}
                  />
                </motion.div>
              );
            }),
          [filters, menuItemClassName, menuLabelClassName]
        )}
      </Menu>
    </div>
  );
}

export default FilterIcon;
