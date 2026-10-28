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
import { useAppSelector } from "app/store/hooks";
import Icon from "app/shared-components/Icon";
import { useTranslation } from "react-i18next";
import { getDemoIdentity, isDemoMode, resetDemoData, switchDemoIdentity, type DemoIdentity } from "src/app/demo/demoMode";

/**
 * The user menu.
 */
function UserMenu() {
  const user = useAppSelector(selectUser);
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
        className="min-h-40 min-w-40 p-0 md:py-4 md:pe-8 md:ps-12"
        onClick={userMenuClick}
        color="inherit"
        sx={{ borderRadius: 12, gap: 1 }}
      >
        <div className="mx-4 hidden flex-col items-end md:flex">
          <Typography
            component="span"
            className="flex text-13 font-semibold leading-tight"
          >
            {user?.firstName
              ? `${user?.firstName} ${user?.lastName}`
              : user?.email}
          </Typography>
          <Typography
            className="text-11 font-medium capitalize leading-tight"
            color="text.secondary"
          >
            {user?.role}
          </Typography>
        </div>

        <Avatar
          sx={{
            width: 36,
            height: 36,
            fontWeight: 700,
            color: "#fff",
            background: "linear-gradient(135deg, #2c5ef5, #7c4dff)",
            boxShadow: "0 0 0 2px #fff, 0 0 0 3px rgba(44,94,245,.35)",
          }}
          alt="user photo"
          src={user?.avatarUrl}
        >
          {(user?.firstName?.[0] ?? user?.email?.[0] ?? "").toUpperCase()}
        </Avatar>
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
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              minWidth: 240,
              borderRadius: "16px",
              p: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: "0 20px 40px -12px rgba(15, 28, 166, .25)",
              "& .MuiMenuItem-root": { borderRadius: "10px", minHeight: 44 },
            },
          },
        }}
      >
        {user && (
          <div className="mb-8 flex items-center gap-12 rounded-12 bg-gray-50 p-12">
            <Avatar
              src={user.avatarUrl}
              sx={{
                color: "#fff",
                background: "linear-gradient(135deg, #2c5ef5, #7c4dff)",
              }}
            >
              {(user.firstName?.[0] ?? user.email?.[0] ?? "").toUpperCase()}
            </Avatar>
            <div className="min-w-0">
              <Typography className="truncate text-14 font-semibold">
                {user.firstName
                  ? `${user.firstName} ${user.lastName ?? ""}`
                  : user.email}
              </Typography>
              <Typography className="truncate text-12" color="text.secondary">
                {user.email}
              </Typography>
            </div>
          </div>
        )}
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
            {isDemoMode ? (
              <>
                {(["admin", "merchant", "affiliate"] as DemoIdentity[]).map((identity) => (
                  <MenuItem key={identity} selected={getDemoIdentity() === identity} onClick={() => switchDemoIdentity(identity)}>
                    <ListItemText primary={`Demo ${identity}`} />
                  </MenuItem>
                ))}
                <MenuItem onClick={resetDemoData}>
                  <ListItemText primary="Reset demo data" />
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
          </>
        )}
      </Popover>
    </>
  );
}

export default UserMenu;
