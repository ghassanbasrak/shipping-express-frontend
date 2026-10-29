import { ReactNode } from "react";
import { Box, Chip, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useTranslation } from "react-i18next";

export type ShipmentSectionStatus = "complete" | "error" | "pending";

export default function ShipmentSection({
  id,
  index,
  icon,
  title,
  subtitle,
  status = "pending",
  action,
  optional = false,
  children,
}: {
  id: string;
  index?: number;
  icon: string;
  title: string;
  subtitle?: string;
  status?: ShipmentSectionStatus;
  action?: ReactNode;
  optional?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation("shipmentsApp");
  return (
    <Paper
      id={`shipment-section-${id}`}
      component="section"
      variant="outlined"
      data-testid={`shipment-section-${id}`}
      sx={(theme) => ({
        borderRadius: "20px",
        overflow: "hidden",
        scrollMarginTop: 16,
        borderColor:
          status === "error"
            ? theme.palette.error.main
            : status === "complete"
              ? alpha(theme.palette.success.main, 0.5)
              : theme.palette.divider,
        boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}, 0 8px 24px -16px ${alpha(theme.palette.primary.main, 0.25)}`,
        transition: "border-color .2s ease",
      })}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: { xs: 2, sm: 3 },
          py: 2,
          background: `linear-gradient(to ${theme.direction === "rtl" ? "left" : "right"}, ${alpha(theme.palette.primary.main, 0.08)}, transparent)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Box
          sx={(theme) => ({
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            color: theme.palette.primary.contrastText,
            background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
            boxShadow: `0 6px 14px -6px ${alpha(theme.palette.primary.main, 0.6)}`,
          })}
        >
          <FuseSvgIcon size={22} color="inherit">
            {icon}
          </FuseSvgIcon>
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography className="text-16 sm:text-18 font-bold leading-tight">
            {index ? `${index}. ` : ""}
            {title}
          </Typography>
          {subtitle && (
            <Typography
              color="text.secondary"
              className="text-12 sm:text-13 mt-2"
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {status === "complete" && (
          <Chip
            size="small"
            color="success"
            variant="outlined"
            icon={
              <FuseSvgIcon size={16}>heroicons-solid:check-circle</FuseSvgIcon>
            }
            label={t("SECTION_COMPLETE")}
            className="hidden sm:inline-flex"
          />
        )}
        {status === "error" && (
          <Chip
            size="small"
            color="error"
            variant="outlined"
            label={t("SECTION_NEEDS_ATTENTION")}
          />
        )}
        {optional && status === "pending" && (
          <Chip size="small" variant="outlined" label={t("OPTIONAL")} />
        )}
        {action}
      </Box>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
    </Paper>
  );
}
