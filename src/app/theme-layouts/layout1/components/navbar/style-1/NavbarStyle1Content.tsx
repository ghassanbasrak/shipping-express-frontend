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
  borderRadius: 24,
  color: theme.palette.text.primary,
  background:
    "linear-gradient(165deg, #0d1b6b 0%, #0a2078 38%, #07154f 100%)",
  border: `1px solid ${alpha("#ffffff", 0.1)}`,
  boxShadow:
    "0 24px 48px -16px rgba(9, 20, 80, .55), inset 0 1px 0 rgba(255,255,255,.08)",
  "&::before, &::after": {
    content: '""',
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
    filter: "blur(40px)",
  },
  "&::before": {
    width: 220,
    height: 220,
    top: -90,
    right: -80,
    background: "radial-gradient(circle, rgba(124,77,255,.55), transparent 70%)",
  },
  "&::after": {
    width: 240,
    height: 240,
    bottom: -100,
    left: -90,
    background: "radial-gradient(circle, rgba(44,94,245,.5), transparent 70%)",
  },
  "& .navbar-dots": {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity: 0.5,
    backgroundImage:
      "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)",
    backgroundSize: "18px 18px",
  },
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
  const { t } = useTranslation("public");
  const user = useAppSelector(selectUser);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user?.email;

  return (
    <Root
      className={clsx(
        "flex h-full flex-auto flex-col overflow-hidden",
        props.className
      )}
    >
      <div className="navbar-dots" />

      <div className="relative z-10 flex h-72 shrink-0 items-center px-20">
        <div className="flex items-center rounded-16 bg-white px-16 py-6 shadow-lg shadow-black/20">
          <img
            className="w-full max-w-112"
            src={"assets/images/logo/logo-text-dark.png"}
            alt="logo"
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
        <div className="relative z-10 shrink-0 p-12">
          <div className="flex items-center gap-10 rounded-16 bg-white/10 p-10 ring-1 ring-white/10 backdrop-blur-md">
            <Avatar
              src={user.avatarUrl}
              alt={displayName}
              sx={{
                width: 40,
                height: 40,
                fontWeight: 700,
                color: "#fff",
                background: "linear-gradient(135deg, #2c5ef5, #7c4dff)",
              }}
            >
              {(user.firstName?.[0] ?? user.email?.[0] ?? "").toUpperCase()}
            </Avatar>
            <div className="min-w-0 flex-1">
              <Typography className="truncate text-13 font-semibold text-white">
                {displayName}
              </Typography>
              <Typography className="truncate text-11 capitalize text-white/60">
                {user.role ?? user.email}
              </Typography>
            </div>
            <Tooltip title={t("SIGN_OUT")}>
              <IconButton
                component={Link}
                to="/sign-out"
                size="small"
                sx={{
                  color: "#fff",
                  backgroundColor: alpha("#ffffff", 0.1),
                  "&:hover": { backgroundColor: alpha("#ff5c7c", 0.35) },
                }}
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
