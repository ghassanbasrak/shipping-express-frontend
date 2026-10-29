import { hasOperationPermission as merchantProfilePermission } from "src/app/auth/permissions";
import { useState } from "react";
import { Alert, Button, Chip, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  toMerchantVerificationStatusTitle,
  toMerchantVerificationStatusColor,
  toMerchantLoyaltyTypeTitle,
} from "../../Utils";
import MerchantActionDialog, {
  MerchantAction,
} from "../../shared-components/MerchantActionDialog";
export default function UserInfoTab({ merchant }: { merchant: IMerchant }) {
  const { t } = useTranslation("merchantsApp"),
    user = useAppSelector(selectUser),
    self = user.role === "user",
    [action, setAction] = useState<MerchantAction>();
  return (
    <div className="space-y-24" data-testid="merchant-info">
      {merchant.isAffiliate &&
        (self ||
          merchantProfilePermission("affiliate-merchants", "view", user)) && (
          <Button
            color="primary"
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
      <Paper variant="outlined" className="p-16 space-y-16">
        <Typography variant="h5">{merchantName(merchant)}</Typography>
        <div className="flex flex-wrap gap-8">
          {(self || canUpdateMerchant(user)) && (
            <Button
              color="primary"
              variant="outlined"
              component={Link}
              to={self ? "/edit-profile" : `/merchants/${merchant.id}`}
            >
              {t("EDIT_ACCOUNT")}
            </Button>
          )}
          {(self || canAdjustMerchantBalance(user)) && (
            <Button
              color="primary"
              variant="outlined"
              component={Link}
              to={
                self
                  ? "/topup-requests/all/new"
                  : `/transactions/${merchant.id}/all/new`
              }
            >
              {t(self ? "TOPUP_BALANCE" : "EDIT_BALANCE")}
            </Button>
          )}
          {self && (
            <>
              <Button
                color="primary"
                variant="outlined"
                component={Link}
                to="/shipment-users/sender"
              >
                {t("VIEW_SENDERS")}
              </Button>
              <Button
                color="primary"
                variant="outlined"
                component={Link}
                to="/shipment-users/receiver"
              >
                {t("VIEW_RECEIVERS")}
              </Button>
              <Button
                color="primary"
                variant="outlined"
                component={Link}
                to="/withdraw-requests/all/new"
              >
                {t("ADD_WITHDRAW_REQUEST")}
              </Button>
              <Button
                color="primary"
                variant="outlined"
                component={Link}
                to="/sign-out"
              >
                {t("SIGN_OUT")}
              </Button>
            </>
          )}
          {canUpdateMerchant(user) && (
            <>
              {canLockMerchantBalance(user) && (
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={() => setAction("closeBalance")}
                >
                  {t("LOCK_BALANCE")}
                </Button>
              )}
              <Button
                color="primary"
                variant="outlined"
                onClick={() =>
                  setAction(
                    merchant.subscriptionBalance > 0
                      ? "cancelPlan"
                      : "subscribe",
                  )
                }
              >
                {t(
                  merchant.subscriptionBalance > 0
                    ? "CANCEL_PAYMENT_PLAN"
                    : "SUBSCRIBE_PLAN",
                )}
              </Button>

              {canBlockMerchant(user) && (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setAction("block")}
                  >
                    {t(
                      merchant.isBlocked
                        ? "ACTIVATE_ACCOUNT"
                        : "DEACTIVATE_ACCOUNT",
                    )}
                  </Button>
                  <Button
                    color="primary"
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
            </>
          )}
        </div>
      </Paper>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {[
          ["EMAIL", merchant.email],
          ["PHONE_NUMBER", merchant.phone],
          ["COMPANY_NAME", merchant.companyName],
          ["TAX_NUMBER", merchant.taxNumber],
          ["CREATED_AT", merchant.createdAt],
          ["ZOHO_ID", merchant.zohoContactId || merchant.zohoId],
          ["BALANCE", Currency(merchant.balance || 0)],
          ["COD_BALANCE", Currency(merchant.codBalance || 0)],
          ["SUBSCRIPTION_BALANCE", Currency(merchant.subscriptionBalance || 0)],
          ["PAYMENT_PLAN", merchant.paymentPlan?.name],
          [
            "ADDRESS",
            [
              localeString(
                merchant.country?.name || merchant.address?.country?.name,
              ),
              localeString(
                merchant.state?.name || merchant.address?.state?.name,
              ),
              localeString(merchant.city?.name || merchant.address?.city?.name),
              merchant.address?.street,
              merchant.address?.zipCode,
            ]
              .filter(Boolean)
              .join(", "),
          ],
        ].map(([label, value]) => (
          <Paper key={label} variant="outlined" className="p-16">
            <Typography className="font-semibold">{t(label)}</Typography>
            <Typography className="break-words whitespace-pre-wrap">
              {value || "—"}
            </Typography>
          </Paper>
        ))}
      </div>
      <div className="flex flex-wrap gap-8">
        <Chip
          label={t(
            toMerchantVerificationStatusTitle(merchant.verificationStatus),
          )}
          className={
            toMerchantVerificationStatusColor(merchant.verificationStatus) +
            " text-white"
          }
        />
        <Chip label={t(toMerchantLoyaltyTypeTitle(merchant.loyaltyType))} />
        {[
          "isBlocked",
          "isRegistered",
          "isAuthorized",
          "emailVerified",
          "phoneVerified",
          "isAffiliate",
        ].map((key) => (
          <Chip
            key={key}
            label={`${t({ isBlocked: "IS_BLOCKED", isRegistered: "IS_REGISTERED", isAuthorized: "ACCOUNT_AUTHORIZATION", emailVerified: "EMAIL_VERIFIED", phoneVerified: "PHONE_VERIFIED", isAffiliate: "IS_AFFILIATE" }[key])}: ${t(merchant[key] ? "YES" : "NO")}`}
          />
        ))}
      </div>

      {self &&
        !["approved", "pending"].includes(merchant.verificationStatus) && (
          <Button
            color="primary"
            variant="outlined"
            component={Link}
            to="/verify-account"
          >
            {t("VERIFY_ACCOUNT")}
          </Button>
        )}
      <div className="space-y-8">
        {merchant.prices?.map((price) => (
          <Paper
            variant="outlined"
            className="p-16"
            key={price.shippingCompanyId}
          >
            <Typography>
              {price.shippingCompany?.name || price.shippingCompanyId}
            </Typography>
            <Typography>
              {t("LOCAL_SHIPPING_COST")}: {price.localPrice ?? "—"} ·{" "}
              {t("COD_COST")}: {price.codPrice ?? "—"} ·{" "}
              {t("INTERNATIONAL_DISCOUNT_RATE")}:{" "}
              {price.internationalDiscountRate ?? "—"}
            </Typography>
          </Paper>
        ))}
      </div>
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
