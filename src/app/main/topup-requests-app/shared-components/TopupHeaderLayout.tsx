import { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import Currency from "../../utils/currencyFormatter";

export function TopupHeaderLayout({
  children,
  testId,
}: {
  children: ReactNode;
  testId: string;
}) {
  return (
    <Box
      component="header"
      data-testid={testId}
      className="flex flex-col gap-24 w-full min-w-0 p-16 border-b-1"
      sx={(theme) => ({
        borderColor: theme.palette.divider,
        background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.045)}, ${theme.palette.background.paper} 75%)`,
      })}
    >
      {children}
    </Box>
  );
}

export function TopupHeaderHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useTranslation("topupRequestsApp");
  return (
    <div className="flex items-start gap-16 min-w-0 flex-1">
      <Box
        className="hidden sm:grid place-items-center shrink-0 w-56 h-56 rounded-16 border-1"
        sx={(theme) => ({
          color: "primary.main",
          bgcolor: alpha(theme.palette.primary.main, 0.09),
          borderColor: alpha(theme.palette.primary.main, 0.12),
        })}
      >
        <FuseSvgIcon size={28} color="inherit">
          heroicons-outline:credit-card
        </FuseSvgIcon>
      </Box>
      <div className="min-w-0">
        <Typography
          color="primary.main"
          className="text-10 font-extrabold tracking-[0.1em] mb-6"
        >
          {t("WALLET_AND_PAYMENTS")}
        </Typography>
        <Typography
          component="h1"
          className="text-24 sm:text-28 font-extrabold leading-tight"
        >
          {title}
        </Typography>
        <Typography
          color="text.secondary"
          className="text-13 leading-[1.7] mt-6 max-w-[580px]"
        >
          {description}
        </Typography>
      </div>
    </div>
  );
}

export function TopupBalanceCard({
  label,
  balance,
  accountName,
}: {
  label: string;
  balance?: number;
  accountName?: string;
}) {
  return (
    <Box
      data-testid="topup-balance"
      className="px-16 py-12 sm:min-w-[220px] w-full sm:w-auto rounded-[14px] border-1 shadow-sm"
      sx={(theme) => ({
        bgcolor: "background.paper",
        borderColor: alpha(theme.palette.primary.main, 0.15),
      })}
    >
      <div className="flex items-center justify-between gap-24">
        <Typography color="text.secondary" className="text-12 font-medium">
          {label}
        </Typography>
        <FuseSvgIcon size={18} color="primary">
          heroicons-outline:cash
        </FuseSvgIcon>
      </div>
      <Typography
        component="div"
        color="primary.main"
        className="text-24 font-extrabold leading-[1.4] mt-4"
      >
        <bdi>
          {typeof balance === "number" && Number.isFinite(balance)
            ? Currency(balance)
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
