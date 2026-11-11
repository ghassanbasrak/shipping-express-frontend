import { ReactNode } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

export default function ShipmentChoiceTile({
  icon,
  title,
  hint,
  active,
  disabled = false,
  testId,
  onClick,
  children,
}: {
  icon: string;
  title: string;
  hint?: string;
  active: boolean;
  disabled?: boolean;
  testId?: string;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <ButtonBase
      role="radio"
      aria-checked={active}
      disabled={disabled}
      data-testid={testId}
      onClick={onClick}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 1.5,
        textAlign: "start",
        p: 1.75,
        borderRadius: "16px",
        border: `2px solid ${active ? theme.palette.primary.main : theme.palette.divider}`,
        backgroundColor: active
          ? alpha(theme.palette.primary.main, 0.07)
          : "transparent",
        transition: "all .2s ease",
        "&:hover": {
          borderColor: theme.palette.primary.light,
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
        },
      })}
    >
      <Box
        sx={(theme) => ({
          width: 40,
          height: 40,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          color: active
            ? theme.palette.primary.contrastText
            : theme.palette.text.secondary,
          backgroundColor: active
            ? theme.palette.primary.main
            : theme.palette.action.hover,
          transition: "all .2s ease",
        })}
      >
        <FuseSvgIcon size={22} color="inherit">
          {icon}
        </FuseSvgIcon>
      </Box>
      <span className="min-w-0 flex-1">
        <Typography className="text-15 font-bold">{title}</Typography>
        {hint && (
          <Typography color="text.secondary" className="text-12">
            {hint}
          </Typography>
        )}
        {children}
      </span>
      {active && (
        <FuseSvgIcon size={22} color="primary">
          heroicons-solid:check-circle
        </FuseSvgIcon>
      )}
    </ButtonBase>
  );
}
