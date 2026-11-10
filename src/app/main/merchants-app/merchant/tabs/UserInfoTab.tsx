import { hasOperationPermission as merchantProfilePermission } from "src/app/auth/permissions";
import { useState } from "react";
import { Avatar, Button, Chip, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import Currency from "../../../utils/currencyFormatter";
import localeString from "../../../utils/localeString";
import IMerchant from "../../models/IMerchant";
import {
  merchantName,
  canUpdateMerchant,
  canAdjustMerchantBalance,
  canLockMerchantBalance,
  canBlockMerchant,
  toMerchantLoyaltyTypeTitle,
} from "../../Utils";
import MerchantActionDialog, {
  MerchantAction,
} from "../../shared-components/MerchantActionDialog";
import "../profile.css";
function ProfileIcon({ children }: { children: string }) {
  return <FuseSvgIcon size={21}>{children}</FuseSvgIcon>;
}
export default function UserInfoTab({ merchant }: { merchant: IMerchant }) {
  const { t, i18n } = useTranslation("merchantsApp"),
    user = useAppSelector(selectUser),
    self = user.role === "user",
    [action, setAction] = useState<MerchantAction>(),
    name = merchantName(merchant),
    canEdit = self || canUpdateMerchant(user),
    date = merchant.createdAt ? new Date(merchant.createdAt) : undefined,
    joined =
      date && Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat(i18n.language, {
            month: "long",
            year: "numeric",
          }).format(date)
        : "—",
    address = [
      localeString(merchant.country?.name || merchant.address?.country?.name),
      localeString(merchant.state?.name || merchant.address?.state?.name),
      localeString(merchant.city?.name || merchant.address?.city?.name),
      merchant.address?.street,
      merchant.address?.zipCode,
    ]
      .filter(Boolean)
      .join(", "),
    money = (value: number | undefined) =>
      Number.isFinite(value) ? Currency(value) : "—";
  const details = [
    ["EMAIL", merchant.email, "heroicons-outline:mail"],
    ["PHONE_NUMBER", merchant.phone, "heroicons-outline:phone"],
    ["COMPANY_NAME", merchant.companyName, "heroicons-outline:office-building"],
    ["TAX_NUMBER", merchant.taxNumber, "heroicons-outline:document-text"],
  ];
  return (
    <div className="merchant-profile space-y-24" data-testid="merchant-info">
      <section className="mp-hero">
        <div className="mp-hero-orbit" aria-hidden="true" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-20">
          <Avatar
            src={merchant.image || merchant.avatarUrl}
            alt={name}
            className="mp-avatar"
          >
            {name?.[0]}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="mp-eyebrow">
              {t(self ? "YOUR_BUSINESS_SPACE" : "MERCHANT_PROFILE")}
            </p>
            <Typography
              component="h2"
              className="text-28 sm:text-32 font-bold leading-tight break-words mt-8"
            >
              {name}
            </Typography>
            <p className="mp-hero-subtitle">
              {merchant.companyName || t("ASHAMCO_EXPRESS")}{" "}
              <span className="mx-8" aria-hidden="true">
                ·
              </span>{" "}
              {t("MEMBER_SINCE", { date: joined })}
            </p>
            <div className="flex gap-8 flex-wrap mt-16">
              <span
                className={`mp-status ${merchant.isBlocked ? "mp-status-blocked" : ""}`}
              >
                <span />
                {t(merchant.isBlocked ? "PROFILE_BLOCKED" : "PROFILE_ACTIVE")}
              </span>
              <span className="mp-price-badge">
                {t(toMerchantLoyaltyTypeTitle(merchant.loyaltyType))}
              </span>
            </div>
          </div>
          {canEdit && (
            <Button
              className="mp-hero-button"
              variant="outlined"
              component={Link}
              to={self ? "/edit-profile" : `/merchants/${merchant.id}`}
              startIcon={
                <ProfileIcon>heroicons-outline:pencil-alt</ProfileIcon>
              }
            >
              {t("EDIT_ACCOUNT")}
            </Button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
        <Paper variant="outlined" className="mp-balance p-24 rounded-16">
          <div className="flex justify-between items-start gap-16">
            <div>
              <p className="mp-label">{t("BALANCE")}</p>
              <Typography
                className="text-32 font-bold tracking-tight mt-12"
                data-testid="profile-wallet"
              >
                {money(merchant.balance)}
              </Typography>
            </div>
            <span className="mp-icon mp-icon-wallet">
              <ProfileIcon>heroicons-outline:credit-card</ProfileIcon>
            </span>
          </div>
          <p className="mp-description mt-8">{t("WALLET_DESCRIPTION")}</p>
          {(self || canAdjustMerchantBalance(user)) && (
            <Button
              component={Link}
              to={
                self
                  ? "/topup-requests/all/new"
                  : `/transactions/${merchant.id}/all/new`
              }
              variant="contained"
              color="primary"
              className="rounded-8 mt-20 shadow-none"
              startIcon={<ProfileIcon>heroicons-outline:plus</ProfileIcon>}
            >
              {t(self ? "TOPUP_BALANCE" : "EDIT_BALANCE")}
            </Button>
          )}
        </Paper>
        <Paper variant="outlined" className="mp-balance p-24 rounded-16">
          <div className="flex justify-between items-start gap-16">
            <div>
              <p className="mp-label">{t("COD_BALANCE")}</p>
              <Typography
                className="text-32 font-bold tracking-tight mt-12"
                data-testid="profile-cod"
              >
                {money(merchant.codBalance)}
              </Typography>
            </div>
            <span className="mp-icon mp-icon-cod">
              <ProfileIcon>heroicons-outline:cash</ProfileIcon>
            </span>
          </div>
          <p className="mp-description mt-8">{t("COD_DESCRIPTION")}</p>
          {self && (
            <Button
              component={Link}
              to="/withdraw-requests/all/new"
              variant="outlined"
              color="primary"
              className="rounded-8 mt-20"
              startIcon={
                <ProfileIcon>heroicons-outline:external-link</ProfileIcon>
              }
            >
              {t("ADD_WITHDRAW_REQUEST")}
            </Button>
          )}
        </Paper>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-24 items-start">
        <Paper
          variant="outlined"
          className="rounded-16 overflow-hidden xl:col-span-2"
        >
          <div className="p-24 border-b border-divider">
            <p className="mp-overline">{t("ACCOUNT_DETAILS")}</p>
            <Typography component="h3" className="text-20 font-semibold mt-4">
              {t("BUSINESS_CONTACT")}
            </Typography>
            <p className="mp-description mt-4">{t("CONTACT_DESCRIPTION")}</p>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-24 gap-y-28 p-24 m-0">
            {details.map(([label, value, icon]) => (
              <div key={label} className="flex gap-12 min-w-0">
                <span className="mp-detail-icon">
                  <ProfileIcon>{icon}</ProfileIcon>
                </span>
                <div className="min-w-0">
                  <dt className="mp-label">{t(label)}</dt>
                  <dd
                    className="m-0 mt-6 font-medium break-words"
                    dir={
                      label === "EMAIL" || label === "PHONE_NUMBER"
                        ? "ltr"
                        : undefined
                    }
                  >
                    {value || "—"}
                  </dd>
                </div>
              </div>
            ))}
            <div className="sm:col-span-2 flex gap-12">
              <span className="mp-detail-icon">
                <ProfileIcon>heroicons-outline:location-marker</ProfileIcon>
              </span>
              <div>
                <dt className="mp-label">{t("ADDRESS")}</dt>
                <dd className="m-0 mt-6 font-medium leading-relaxed break-words">
                  {address || "—"}
                </dd>
              </div>
            </div>
          </dl>
        </Paper>
        <div className="space-y-20">
          <Paper variant="outlined" className="p-24 rounded-16 space-y-16">
            <Typography component="h3" className="text-18 font-semibold">
              {t(self ? "QUICK_ACTIONS" : "ACCOUNT_STATUS")}
            </Typography>
            {self && (
              <div className="space-y-8">
                <Button
                  fullWidth
                  className="justify-start rounded-8 py-10"
                  component={Link}
                  to="/shipment-users/sender"
                  startIcon={
                    <ProfileIcon>heroicons-outline:user-circle</ProfileIcon>
                  }
                >
                  {t("VIEW_SENDERS")}
                </Button>
                <Button
                  fullWidth
                  className="justify-start rounded-8 py-10"
                  component={Link}
                  to="/shipment-users/receiver"
                  startIcon={
                    <ProfileIcon>heroicons-outline:user-group</ProfileIcon>
                  }
                >
                  {t("VIEW_RECEIVERS")}
                </Button>
                <Button
                  fullWidth
                  className="justify-start rounded-8 py-10"
                  component={Link}
                  to="/sign-out"
                  startIcon={
                    <ProfileIcon>heroicons-outline:logout</ProfileIcon>
                  }
                >
                  {t("SIGN_OUT")}
                </Button>
              </div>
            )}
            {merchant.isAffiliate &&
              (self ||
                merchantProfilePermission(
                  "affiliate-merchants",
                  "view",
                  user,
                )) && (
                <Button
                  fullWidth
                  variant="outlined"
                  component={Link}
                  to={
                    self
                      ? "/affiliate-profile"
                      : `/affiliate-merchants/${merchant.id}/info`
                  }
                >
                  {t("AFFILIATE_PROFILE")}
                </Button>
              )}
            {!self && (
              <div className="space-y-12 text-13">
                {[
                  ["IS_REGISTERED", merchant.isRegistered],
                  ["ACCOUNT_AUTHORIZATION", merchant.isAuthorized],
                  ["IS_AFFILIATE", merchant.isAffiliate],
                ].map(([key, value]) => (
                  <div
                    className="flex justify-between gap-12"
                    key={String(key)}
                  >
                    <span className="mp-description">{t(String(key))}</span>
                    <strong>{t(value ? "YES" : "NO")}</strong>
                  </div>
                ))}
                <div className="pt-12 border-t border-divider">
                  <p className="mp-label">{t("ZOHO_ID")}</p>
                  <p className="mt-6 break-all">
                    {merchant.zohoContactId || merchant.zohoId || "—"}
                  </p>
                </div>
              </div>
            )}
          </Paper>
          {!self && canUpdateMerchant(user) && (
            <Paper variant="outlined" className="p-24 rounded-16 space-y-12">
              <Typography component="h3" className="text-18 font-semibold">
                {t("ACCOUNT_CONTROLS")}
              </Typography>
              <p className="mp-description">{t("STAFF_CONTROLS_HINT")}</p>
              {canLockMerchantBalance(user) && (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setAction("closeBalance")}
                >
                  {t("LOCK_BALANCE")}
                </Button>
              )}
              {canBlockMerchant(user) && (
                <>
                  <Button
                    fullWidth
                    variant="outlined"
                    color={merchant.isBlocked ? "success" : "error"}
                    onClick={() => setAction("block")}
                  >
                    {t(
                      merchant.isBlocked
                        ? "ACTIVATE_ACCOUNT"
                        : "DEACTIVATE_ACCOUNT",
                    )}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setAction("affiliate")}
                  >
                    {t(
                      merchant.isAffiliate
                        ? "DEACTIVATE_AFFILIATE"
                        : "ACTIVATE_AFFILIATE",
                    )}
                  </Button>
                </>
              )}
            </Paper>
          )}
        </div>
      </div>
      {!!merchant.prices?.length && (
        <section className="space-y-16">
          <div>
            <p className="mp-overline">{t("SHIPPING_PRICES")}</p>
            <Typography component="h3" className="text-22 font-semibold mt-4">
              {t("YOUR_CARRIER_RATES")}
            </Typography>
            <p className="mp-description mt-6">{t("CARRIER_RATES_HINT")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-16">
            {merchant.prices.map((price, index) => (
              <Paper
                variant="outlined"
                className="p-24 rounded-16"
                key={price.shippingCompanyId || price.id || index}
              >
                <div className="flex items-center gap-12 mb-20">
                  <Avatar
                    variant="rounded"
                    sx={{ bgcolor: "action.selected", color: "primary.main" }}
                  >
                    {(price.shippingCompany?.name || "—")[0]}
                  </Avatar>
                  <Typography className="font-semibold">
                    {price.shippingCompany?.name || price.shippingCompanyId}
                  </Typography>
                </div>
                {[
                  ["LOCAL_SHIPPING_COST", price.localPrice, true],
                  ["COD_COST", price.codPrice, true],
                  [
                    "INTERNATIONAL_DISCOUNT_RATE",
                    price.internationalDiscountRate,
                    false,
                  ],
                ].map(([key, value, currency]) => (
                  <div
                    key={String(key)}
                    className="flex justify-between gap-16 py-8 text-13"
                  >
                    <span className="mp-description">{t(String(key))}</span>
                    <strong>
                      {value == null
                        ? "—"
                        : currency
                          ? Currency(Number(value))
                          : `${value}%`}
                    </strong>
                  </div>
                ))}
              </Paper>
            ))}
          </div>
        </section>
      )}
      {action && (
        <MerchantActionDialog
          action={action}
          merchant={merchant}
          onClose={() => setAction(undefined)}
        />
      )}
    </div>
  );
}
