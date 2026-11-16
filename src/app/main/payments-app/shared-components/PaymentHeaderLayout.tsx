import FeatureHeader, {
  FeatureHeaderHeading,
} from "app/shared-components/feature-header/FeatureHeader";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import FeatureHeaderSummaryCard from "app/shared-components/feature-header/FeatureHeaderSummaryCard";

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
    <FeatureHeaderSummaryCard
      label={label}
      amount={balance}
      accountName={accountName}
      testId="payment-balance"
    />
  );
}
