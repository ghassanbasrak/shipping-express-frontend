import { alpha, styled, ThemeProvider } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Hidden from "@mui/material/Hidden";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  selectFuseCurrentLayoutConfig,
  selectToolbarTheme,
} from "@fuse/core/FuseSettings/fuseSettingsSlice";
import { Layout1ConfigDefaultsType } from "app/theme-layouts/layout1/Layout1Config";
import NavbarToggleButton from "app/theme-layouts/shared-components/navbar/NavbarToggleButton";
import { selectFuseNavbar } from "app/theme-layouts/shared-components/navbar/navbarSlice";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import AdjustFontSize from "../../shared-components/AdjustFontSize";
import FullScreenToggle from "../../shared-components/FullScreenToggle";
import LanguageSwitcher from "../../shared-components/LanguageSwitcher";
import UserMenu from "../../shared-components/UserMenu";

const ToggleWrapper = styled("div")(({ theme }) => ({
  "& .MuiIconButton-root": {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 2px 6px -2px rgba(15, 28, 166, .12)",
    transition: "all .2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.secondary.main, 0.08),
      borderColor: alpha(theme.palette.secondary.main, 0.4),
    },
  },
}));

const ActionsCluster = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 2,
  height: 48,
  padding: "0 6px",
  borderRadius: 16,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "0 2px 8px -4px rgba(15, 28, 166, .15)",
  "& .MuiIconButton-root, & .MuiButton-root": {
    borderRadius: 12,
  },
}));

type ToolbarLayout1Props = {
  className?: string;
};

/**
 * The toolbar layout 1.
 */
function ToolbarLayout1(props: ToolbarLayout1Props) {
  const { className } = props;
  const config = useAppSelector(
    selectFuseCurrentLayoutConfig,
  ) as Layout1ConfigDefaultsType;
  const navbar = useAppSelector(selectFuseNavbar);
  const toolbarTheme = useAppSelector(selectToolbarTheme);
  const user = useAppSelector(selectUser);
  const { t, i18n } = useTranslation("public");

  const today = useMemo(() => {
    try {
      return new Date().toLocaleDateString(i18n.language, {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch {
      return "";
    }
  }, [i18n.language]);

  return (
    <ThemeProvider theme={toolbarTheme}>
      <AppBar
        id="fuse-toolbar"
        className={clsx("z-20 flex", className)}
        color="default"
        sx={{
          backgroundColor: (theme) =>
            alpha(
              theme.palette.mode === "light"
                ? toolbarTheme.palette.background.default
                : toolbarTheme.palette.background.paper,
              0.72,
            ),
          backdropFilter: "blur(16px) saturate(160%)",
          WebkitBackdropFilter: "blur(16px) saturate(160%)",
          borderBottom: (theme) =>
            `1px solid ${alpha(theme.palette.divider, 0.7)}`,
          boxShadow: "none",
        }}
        position={className?.includes("sticky") ? "sticky" : "static"}
        elevation={0}
      >
        <Toolbar className="min-h-64 gap-12 p-0 md:min-h-72">
          <div className="flex min-w-0 flex-1 items-center gap-16 px-16">
            {config.navbar.display && config.navbar.position === "left" && (
              <ToggleWrapper>
                <NavbarToggleButton />
              </ToggleWrapper>
            )}

            <Hidden smDown>
              <div className="flex min-w-0 flex-col">
                <Typography
                  className="truncate text-12 font-semibold uppercase tracking-wider"
                  color="text.secondary"
                >
                  {today}
                </Typography>
                {user && (
                  <Typography className="truncate text-18 font-bold leading-tight tracking-tight">
                    {t("SIGNED_IN_WITH_JWT")}
                    {user.firstName
                      ? `${i18n.language === "ar" ? "،" : ","} ${user.firstName}`
                      : ""}
                  </Typography>
                )}
              </div>
            </Hidden>
          </div>

          <div className="flex h-full shrink-0 items-center px-16">
            <ActionsCluster>
              <LanguageSwitcher />
              <AdjustFontSize />
              <FullScreenToggle />
              <span className="mx-4 h-24 w-1 bg-gray-200" />
              <UserMenu />
            </ActionsCluster>
          </div>

          {config.navbar.display && config.navbar.position === "right" && (
            <>
              <Hidden lgDown>
                {!navbar.open && (
                  <NavbarToggleButton className="mx-0 h-40 w-40 p-0" />
                )}
              </Hidden>

              <Hidden lgUp>
                <NavbarToggleButton className="mx-0 h-40 w-40 p-0 sm:mx-8" />
              </Hidden>
            </>
          )}
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  );
}

export default memo(ToolbarLayout1);
