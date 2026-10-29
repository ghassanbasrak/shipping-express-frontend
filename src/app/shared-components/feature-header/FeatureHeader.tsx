import { Children, ReactNode } from "react";
import { Box, BoxProps, Button, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "../filter-icon/FilterIcon";
import type { FilterIconProps } from "../filter-icon/Utils";
import features, { HeaderFeature } from "./content";

export default function FeatureHeader({
  children,
  className = "",
  ...props
}: BoxProps) {
  return (
    <Box
      component="header"
      {...props}
      data-feature-header="true"
      className={`flex flex-col gap-24 w-full min-w-0 p-16 border-b-1 ${className}`}
      sx={(theme) => ({
        borderColor: theme.palette.divider,
        background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.045)}, ${theme.palette.background.paper} 75%)`,
      })}
    >
      {children}
    </Box>
  );
}
export function FeatureHeaderRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-16 min-w-0">
      {children}
    </div>
  );
}
export function FeatureHeaderHeading({
  feature,
  children,
  description,
  eyebrow,
  icon,
  leading,
}: {
  feature: HeaderFeature;
  children: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  icon?: string;
  leading?: ReactNode;
}) {
  const { t } = useTranslation("featureHeaders");
  const config = features[feature];
  return (
    <div className="flex items-start gap-16 min-w-0 flex-1">
      <Box
        className={`${leading ? "grid" : "hidden sm:grid"} place-items-center shrink-0 w-56 h-56 rounded-16 border-1`}
        sx={(theme) => ({
          color: "primary.main",
          bgcolor: alpha(theme.palette.primary.main, 0.09),
          borderColor: alpha(theme.palette.primary.main, 0.12),
        })}
      >
        {leading || (
          <FuseSvgIcon size={28} color="inherit">
            {icon || `heroicons-outline:${config[0]}`}
          </FuseSvgIcon>
        )}
      </Box>
      <div className="min-w-0">
        <Typography
          color="primary.main"
          className="text-10 font-extrabold tracking-[0.1em] mb-6"
        >
          {eyebrow ?? t(config[1])}
        </Typography>
        <Typography
          component="h1"
          className="text-24 sm:text-28 font-extrabold leading-tight break-words"
        >
          {children}
        </Typography>
        <Typography
          component="div"
          color="text.secondary"
          className="text-13 leading-[1.7] mt-6 max-w-[580px]"
        >
          {description ?? t(feature)}
        </Typography>
      </div>
    </div>
  );
}
export function FeatureHeaderActions({ children }: { children: ReactNode }) {
  if (!Children.toArray(children).length) return null;
  return (
    <div className="flex flex-wrap items-center gap-8 min-w-0 lg:max-w-[55%] lg:justify-end [&>.MuiButton-root]:rounded-[10px] [&>.MuiButton-root]:shadow-none [&>.MuiButton-root]:whitespace-nowrap [&>.MuiButton-root]:min-h-44">
      {children}
    </div>
  );
}
export function FeatureHeaderMeta({ children }: { children: ReactNode }) {
  return (
    <Box
      className="px-16 py-12 rounded-[14px] border-1 shadow-sm min-w-0 [overflow-wrap:anywhere] [&_.MuiTypography-root]:text-13 [&_.MuiTypography-root]:font-semibold"
      sx={(theme) => ({
        bgcolor: "background.paper",
        borderColor: alpha(theme.palette.primary.main, 0.15),
      })}
    >
      {children}
    </Box>
  );
}
export function FeatureHeaderToolbar({
  search,
  children,
}: {
  search?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      className="flex flex-col sm:flex-row sm:items-center gap-8 p-6 w-full min-w-0 rounded-12 border-1"
      sx={{ borderColor: "divider" }}
      data-testid="feature-header-toolbar"
    >
      {search && (
        <div className="flex items-center gap-8 px-8 min-h-36 min-w-0 flex-1">
          <FuseSvgIcon size={18} color="disabled">
            heroicons-outline:search
          </FuseSvgIcon>
          {search}
        </div>
      )}
      {children && (
        <div className="flex flex-wrap items-center gap-8 min-w-0 shrink-0 [&>div]:flex [&>div]:flex-1 sm:[&>div]:flex-initial [&_.MuiBadge-root]:w-full [&_.MuiButton-root]:rounded-8 [&_.MuiButton-root]:min-h-36 [&_.MuiButton-root]:text-12">
          {children}
        </div>
      )}
    </Paper>
  );
}
export function FeatureHeaderFilter<T extends object>(
  props: FilterIconProps<T>,
) {
  const { t } = useTranslation("featureHeaders");
  const changesCount =
    props.changesCount ??
    props.filters.filter((filter) => {
      const value = "value" in filter ? filter.value : undefined;
      const active = (item: unknown) =>
        item !== undefined &&
        item !== null &&
        item !== "" &&
        item !== "all" &&
        item !== false;
      return Array.isArray(value)
        ? value.some(active)
        : value instanceof Date
          ? Number.isFinite(value.getTime())
          : active(value);
    }).length;
  return (
    <FilterIcon
      {...props}
      changesCount={changesCount}
      component={Button}
      componentProps={{
        ...props.componentProps,
        variant: "outlined",
        color: "primary",
        size: "small",
        fullWidth: true,
        className: "rounded-8 min-h-36 px-12 text-12 whitespace-nowrap",
        startIcon: (
          <FuseSvgIcon size={16}>heroicons-outline:filter</FuseSvgIcon>
        ),
        children: t("FILTERS"),
      }}
    />
  );
}
