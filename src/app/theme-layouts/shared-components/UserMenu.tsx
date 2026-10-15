import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Link } from "react-router-dom";
import { selectUser } from "src/app/auth/user/store/userSlice";
import useAuth from "src/app/auth/useAuth";
import { darken } from "@mui/material/styles";
import { useAppSelector } from "app/store/hooks";
import Icon from "app/shared-components/Icon";
import { useTranslation } from "react-i18next";

/**
 * The user menu.
 */
function UserMenu() {
  const user = useAppSelector(selectUser);
  const { signOut } = useAuth();
  const [userMenu, setUserMenu] = useState<HTMLElement | null>(null);
  const { t } = useTranslation("public");
  const userMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenu(event.currentTarget);
  };

  const userMenuClose = () => {
    setUserMenu(null);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Button
        className="min-h-40 min-w-40 p-0 md:px-16 md:py-6"
        onClick={userMenuClick}
        color="inherit"
      >
        <div className="mx-4 hidden flex-col items-end md:flex">
          <Typography component="span" className="flex font-semibold">
            {user?.firstName
              ? `${user?.firstName} ${user?.lastName}`
              : user?.email}
          </Typography>
          <Typography className="text-11 font-medium" color="text.secondary">
            {user?.email}
          </Typography>
        </div>

        {user?.avatarUrl ? (
          <Avatar
            sx={{
              background: (theme) => theme.palette.background.default,
              color: (theme) => theme.palette.text.secondary,
            }}
            alt="user photo"
            src={user?.avatarUrl}
          />
        ) : (
          <Avatar
            sx={{
              background: (theme) =>
                darken(theme.palette.background.default, 0.05),
              color: (theme) => theme.palette.text.secondary,
            }}
          >
            {user?.firstName?.[0]}
          </Avatar>
        )}
      </Button>

      <Popover
        open={Boolean(userMenu)}
        anchorEl={userMenu}
        onClose={userMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        classes={{
          paper: "py-8",
        }}
      >
        {!user ? (
          <>
            <MenuItem component={Link} to="/sign-in" role="button">
              <ListItemIcon className="min-w-40">
                <Icon type="fa" name="FaSignInAlt" size="1.5em" />
              </ListItemIcon>
              <ListItemText primary={t("SIGN_IN")} />
            </MenuItem>
            <MenuItem component={Link} to="/sign-up" role="button">
              <ListItemIcon className="min-w-40">
                <Icon type="fa" name="FaUserCheck" size="1.5em" />
              </ListItemIcon>
              <ListItemText primary={t("SIGN_UP")} />
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem
              component={Link}
              to="/profile"
              onClick={userMenuClose}
              role="button"
            >
              <ListItemIcon className="min-w-40">
                <Icon type="fa6" name="FaCircleUser" size="1.5em" />
              </ListItemIcon>
              <ListItemText primary={t("MY_PROFILE")} />
            </MenuItem>
            <MenuItem
              component={Link}
              to="/sign-out"
              onClick={() => {
                userMenuClose();
              }}
            >
              <ListItemIcon className="min-w-40">
                <Icon type="fa" name="FaSignOutAlt" size="1.5em" />
              </ListItemIcon>
              <ListItemText primary={t("SIGN_OUT")} />
            </MenuItem>
          </>
        )}
      </Popover>
    </>
  );
}

export default UserMenu;
