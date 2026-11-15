import FuseScrollbars from "@fuse/core/FuseScrollbars";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { alpha, styled } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { memo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navigation from "app/theme-layouts/shared-components/navigation/Navigation";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";

const Root = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: 20,
  color: theme.palette.text.primary,
  // Flat brand panel (purple-900), as in the approved dashboard replica
  backgroundColor: theme.palette.background.default,
  "& ::-webkit-scrollbar-thumb": {
    boxShadow: "inset 0 0 0 20px rgba(255, 255, 255, 0.18)",
  },
}));

const StyledContent = styled(FuseScrollbars)(() => ({
  overscrollBehavior: "contain",
  overflowX: "hidden",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
}));

type NavbarStyle1ContentProps = {
  className?: string;
};

/**
 * The navbar style 1 content.
 */
function NavbarStyle1Content(props: NavbarStyle1ContentProps) {
  const { t, i18n } = useTranslation("public");
  const user = useAppSelector(selectUser);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user?.email;

  return (
    <Root
      className={clsx(
        "flex h-full flex-auto flex-col overflow-hidden",
        props.className,
      )}
    >
      <div className="relative z-10 flex shrink-0 items-center justify-center px-20 pb-4 pt-20">
        <div className="flex w-full items-center justify-center">
          <img
            className="w-full"
            style={{ maxWidth: 136 }}
            src={`/brand/logos/ashamco-${i18n.language.startsWith("ar") ? "ar" : "en"}-on-purple.svg`}
            alt="اشامكو إكسبريس"
          />
        </div>
      </div>

      <StyledContent
        className="relative z-10 flex min-h-0 flex-1 flex-col px-12 pb-8 pt-4"
        option={{ suppressScrollX: true, wheelPropagation: false }}
      >
        <Navigation layout="vertical" />
      </StyledContent>

      {user && (
        <div className="relative z-10 shrink-0 p-10">
          <div
            className="flex items-center gap-10 rounded-lg p-10"
            style={{ backgroundColor: "var(--purple-700)" }}
          >
            <Avatar
              src={user.avatarUrl}
              alt={displayName}
              sx={{
                width: 40,
                height: 40,
                fontWeight: 700,
                color: "var(--purple-800)",
                backgroundColor: "#fff",
              }}
            >
              {(user.firstName?.[0] ?? user.email?.[0] ?? "").toUpperCase()}
            </Avatar>
            <div className="min-w-0 flex-1">
              <Typography className="truncate text-13 font-semibold text-white">
                {displayName}
              </Typography>
              <Typography
                className="truncate text-11 capitalize"
                style={{ color: "var(--purple-100)" }}
              >
                {user.role ?? user.email}
              </Typography>
            </div>
            <Tooltip title={t("SIGN_OUT")}>
              <IconButton
                component={Link}
                to="/sign-out"
                size="small"
                sx={(theme) => ({
                  color: "#fff",
                  backgroundColor: alpha("#ffffff", 0.1),
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.error.main, 0.55),
                  },
                })}
              >
                <FuseSvgIcon size={18}>heroicons-outline:logout</FuseSvgIcon>
              </IconButton>
            </Tooltip>
          </div>
        </div>
      )}
    </Root>
  );
}

export default memo(NavbarStyle1Content);
