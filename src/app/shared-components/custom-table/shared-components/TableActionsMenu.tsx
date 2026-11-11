import { useState } from "react";
import { TableActionsMenuProps, tableDefaultLinkTarget } from "../Utils";
import { IconButton, Menu, MenuItem } from "@mui/material";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { Link } from "react-router-dom";

function TableActionsMenu<T extends object>({
  actions = [],
  row,
}: TableActionsMenuProps<T>) {
  const [menu, setMenu] = useState<HTMLElement | null>(null);

  function handleMenuOpen(event: React.MouseEvent<HTMLElement>) {
    setMenu(event.currentTarget);
  }

  function handleMenuClose() {
    setMenu(null);
  }

  return (
    <>
      <IconButton
        color="primary"
        className="-ms-8 p-0 w-20 h-32"
        size="small"
        aria-label="More"
        aria-haspopup="true"
        onClick={handleMenuOpen}
      >
        <FuseSvgIcon size={22}>material-outline:more_vert</FuseSvgIcon>
      </IconButton>
      <Menu anchorEl={menu} open={Boolean(menu)} onClose={handleMenuClose}>
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            component={action.link && Link}
            to={action.link && action.linkGetter(row)}
            target={action.link && (action.target ?? tableDefaultLinkTarget)}
            role="button"
            onClick={() => {
              handleMenuClose();
              if (action.onActionClick) {
                action.onActionClick(row);
              }
            }}
          >
            {action.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default TableActionsMenu;
