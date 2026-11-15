import FeatureHeader, {
  FeatureHeaderHeading,
} from "app/shared-components/feature-header/FeatureHeader";
import { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import Currency from "../../utils/currencyFormatter";

export function PaymentHeaderLayout({
  children,
  testId,
}: {
  children: ReactNode;
  testId: string;
}) {
  return <FeatureHeader data-testid={testId}>{children}</FeatureHeader>;
}

export function PaymentHeaderHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useTranslation("paymentsApp");
  return (
    <FeatureHeaderHeading
      feature="payments-app"
      description={description}
      eyebrow={t("WALLET_AND_PAYMENTS")}
    >
      {title}
    </FeatureHeaderHeading>
  );
}

export function PaymentBalanceCard({
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
      data-testid="payment-balance"
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
