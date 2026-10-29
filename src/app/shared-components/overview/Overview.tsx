import FusePageSimple from "@fuse/core/FusePageSimple";
import { ReactNode } from "react";
import {
  Alert,
  Button,
  Chip,
  Skeleton,
  Typography,
  TextField,
  useTheme,
} from "@mui/material";
import {
  ArrowForward,
  Refresh,
  Logout,
  LocalShipping,
  Groups,
  AccountBalanceWallet,
  Payments,
  TrendingUp,
  Inventory2,
  Public,
  Calculate,
  ContactPhone,
  VerifiedUser,
  RequestQuote,
  AccountTree,
  Close,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import { isDemoMode, resetDemoData } from "src/app/demo/demoMode";
import { overviewNumber, overviewPercent } from "./Utils";
import en from "./i18n/en";
import ar from "./i18n/ar";
import "./overview.css";
i18next.addResourceBundle("en", "overview", en);
i18next.addResourceBundle("ar", "overview", ar);
const icons = {
  local_shipping: LocalShipping,
  groups: Groups,
  account_balance_wallet: AccountBalanceWallet,
  payments: Payments,
  trending_up: TrendingUp,
  inventory_2: Inventory2,
  public: Public,
  calculate: Calculate,
  contact_phone: ContactPhone,
  verified_user: VerifiedUser,
  request_quote: RequestQuote,
  account_tree: AccountTree,
  close: Close,
};
export function OverviewIcon({ name }: { name: string }) {
  const Icon = icons[name] || LocalShipping;
  return <Icon fontSize="small" />;
}
export type OverviewQuery = {
  isFetching: boolean;
  isError: boolean;
  currentData?: unknown;
  fulfilledTimeStamp?: number;
  refetch: () => unknown;
};
export function OverviewShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <FusePageSimple
      scroll="page"
      content={
        <div
          className="ov-root"
          style={
            {
              "--ov-paper": theme.palette.background.paper,
              "--ov-ink": theme.palette.text.primary,
              "--ov-muted": theme.palette.text.secondary,
              "--ov-border": theme.palette.divider,
              "--ov-bg": theme.palette.mode === "dark" ? "#111b2d" : "#f4f7fb",
            } as React.CSSProperties
          }
        >
          <div className="ov-container">{children}</div>
        </div>
      }
    />
  );
}
export function OverviewHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="ov-header">
      <div className="ov-heading">
        <span className="ov-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="ov-header-actions">{children}</div>
    </header>
  );
}
export function OverviewRefresh({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation("overview");
  return (
    <Button
      color="primary"
      className="ov-refresh"
      variant="outlined"
      startIcon={<Refresh />}
      onClick={onClick}
      data-testid="overview-refresh"
    >
      {t("REFRESH")}
    </Button>
  );
}
export function OverviewFooter() {
  const { t } = useTranslation("overview"),
    { user, signOut } = useJwtAuth();
  return (
    <footer className="ov-footer">
      <span>Ashamco Express · {user?.email}</span>
      <div className="ov-footer-actions">
        {isDemoMode && (
          <>
            <Chip size="small" label={t("DEMO_MODE")} />
            <Button
              color="primary"
              variant="outlined"
              component={Link}
              to="/countries/all"
            >
              {t("COUNTRIES")}
            </Button>
            <Button
              color="primary"
              variant="outlined"
              component={Link}
              to="/shipping-companies"
            >
              {t("CARRIERS")}
            </Button>
            <Button color="primary" variant="outlined" onClick={resetDemoData}>
              {t("RESET_DEMO")}
            </Button>
          </>
        )}
        <Button
          color="primary"
          variant="outlined"
          onClick={signOut}
          startIcon={<Logout fontSize="small" />}
        >
          {t("SIGN_OUT")}
        </Button>
      </div>
    </footer>
  );
}
export function QueryFeedback({ query }: { query: OverviewQuery }) {
  const { t, i18n } = useTranslation("overview");
  return (
    <>
      {query.isError ? (
        <Alert
          severity="warning"
          className="ov-query-error"
          action={
            <Button
              color="primary"
              variant="outlined"
              size="small"
              onClick={() => query.refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t(
            query.currentData !== undefined ? "REFRESH_FAILED" : "LOAD_FAILED",
          )}
        </Alert>
      ) : query.isFetching ? (
        <span className="ov-update" role="status">
          {t("UPDATING")}
        </span>
      ) : query.fulfilledTimeStamp ? (
        <span className="ov-updated">
          {t("UPDATED")}{" "}
          {new Intl.DateTimeFormat(i18n.language, {
            hour: "2-digit",
            minute: "2-digit",
          }).format(query.fulfilledTimeStamp)}
        </span>
      ) : null}
    </>
  );
}
export function OverviewSection({
  title,
  subtitle,
  action,
  controls,
  query,
  children,
  className = "",
  testId,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  controls?: ReactNode;
  query?: OverviewQuery;
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section className={`ov-section ${className}`} data-testid={testId}>
      <div className="ov-section-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {controls}
      {query && <QueryFeedback query={query} />}
      <div className="ov-section-content">
        {query?.isFetching && query.currentData === undefined ? (
          <div className="ov-skeleton">
            <Skeleton height={34} />
            <Skeleton height={34} />
            <Skeleton height={34} />
          </div>
        ) : query?.isError && query.currentData === undefined ? null : (
          children
        )}
      </div>
    </section>
  );
}
export function MetricCard({
  title,
  value,
  icon,
  scope,
  query,
  change,
  accent = "#0f9d8c",
  note,
  testId,
}: {
  title: string;
  value: string;
  icon: string;
  scope: string;
  query?: OverviewQuery;
  change?: unknown;
  accent?: string;
  note?: string;
  testId?: string;
}) {
  const { t, i18n } = useTranslation("overview"),
    n = overviewNumber(change);
  return (
    <article
      className="ov-metric"
      data-testid={testId}
      style={{ "--ov-accent": accent } as React.CSSProperties}
    >
      <div className="ov-metric-heading">
        <span>{title}</span>
        <span className="ov-icon">
          <OverviewIcon name={icon} />
        </span>
      </div>
      <div
        className="ov-metric-value"
        title={value === "—" ? t("NOT_PROVIDED") : undefined}
      >
        {query?.isFetching && query.currentData === undefined ? (
          <Skeleton width="75%" />
        ) : (
          value
        )}
      </div>
      <div className="ov-metric-meta">
        {n !== null && (
          <span
            className={`ov-change ${n > 0 ? "positive" : n < 0 ? "negative" : "neutral"}`}
            title={t("REPORTED_CHANGE")}
          >
            {overviewPercent(n, i18n.language)}
          </span>
        )}
        <span>{scope}</span>
      </div>
      {note && <p className="ov-note">{note}</p>}
      {query && <QueryFeedback query={query} />}
    </article>
  );
}
function DirectionArrow({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  return (
    <ArrowForward
      className={className}
      fontSize="small"
      style={{ transform: i18n.dir() === "rtl" ? "rotate(180deg)" : "none" }}
    />
  );
}
export function OverviewLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Button
      color="primary"
      variant="outlined"
      className="ov-text-link"
      size="small"
      component={Link}
      to={to}
      endIcon={<DirectionArrow />}
    >
      {children}
    </Button>
  );
}
export function QuickAction({
  to,
  title,
  description,
  icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link className="ov-quick-action" to={to}>
      <span className="ov-quick-icon">
        <OverviewIcon name={icon} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <DirectionArrow className="ov-arrow" />
    </Link>
  );
}
export function OverviewEmpty({ children }: { children: ReactNode }) {
  return <div className="ov-empty">{children}</div>;
}

export function OverviewSelect({
  label,
  value,
  onChange,
  options,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  testId?: string;
}) {
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      SelectProps={{ native: true }}
      inputProps={{ "data-testid": testId }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </TextField>
  );
}
