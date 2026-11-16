import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import Currency from "src/app/main/utils/currencyFormatter";

export default function FeatureHeaderSummaryCard({
  label,
  amount,
  accountName,
  color = "primary",
  testId,
  loading = false,
}: {
  label: string;
  amount?: number;
  accountName?: string;
  color?: "primary" | "secondary" | "error" | "success";
  testId?: string;
  loading?: boolean;
}) {
  return (
    <Box
      data-testid={testId}
      aria-busy={loading}
      className="px-16 py-12 sm:min-w-[220px] w-full sm:w-auto rounded-[14px] border-1 shadow-sm"
      sx={(theme) => ({
        bgcolor: "background.paper",
        borderColor: alpha(theme.palette[color].main, 0.15),
      })}
    >
      <div className="flex items-center justify-between gap-24">
        <Typography color="text.secondary" className="text-12 font-medium">
          {label}
        </Typography>
        <FuseSvgIcon size={18} color={color}>
          heroicons-outline:cash
        </FuseSvgIcon>
      </div>
      <Typography
        component="div"
        color={`${color}.main`}
        className="text-24 font-extrabold leading-[1.4] mt-4"
      >
        <bdi>
          {loading
            ? "…"
            : typeof amount === "number" && Number.isFinite(amount)
              ? Currency(amount)
              : "—"}
        </bdi>
      </Typography>
      {accountName && (
        <Typography
          color="text.secondary"
          className="text-11 mt-2 [overflow-wrap:anywhere]"
        >
          {accountName}
        </Typography>
      )}
    </Box>
  );
}
