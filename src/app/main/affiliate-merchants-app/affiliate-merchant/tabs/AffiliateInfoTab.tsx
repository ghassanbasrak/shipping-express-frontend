import { useState } from "react";
import { Alert, Button, Card, CardContent, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import CopyableText from "app/shared-components/CopyableText";
import Currency from "../../../utils/currencyFormatter";
import localeString from "../../../utils/localeString";
import {
  canUpdateMerchant,
  canBlockMerchant,
  canAdjustMerchantBalance,
} from "../../../merchants-app/Utils";
import MerchantActionDialog from "../../../merchants-app/shared-components/MerchantActionDialog";
import { useGetShippingCompaniesQuery } from "../../../shipping-companies-app/ShippingCompaniesApi";
import { useGetAffiliateSummaryQuery } from "../../AffiliateMerchantsApi";
import IAffiliateMerchant from "../../models/IAffiliateMerchant";
import {
  canViewAffiliateCustomers,
  canViewAffiliateTransactions,
  referralLink,
} from "../../Utils";
export default function AffiliateInfoTab({
  affiliate,
  onTab,
}: {
  affiliate: IAffiliateMerchant;
  onTab: (tab: string) => void;
}) {
  const { t } = useTranslation("affiliateMerchantsApp"),
    user = useAppSelector(selectUser),
    self = user.role === "user",
    summary = useGetAffiliateSummaryQuery(affiliate.id, {
      refetchOnMountOrArgChange: true,
    }),
    carriers = useGetShippingCompaniesQuery({ page: 0, pageSize: 50 }),
    [deactivate, setDeactivate] = useState(false),
    data = summary.currentData;
  const summaries = [
    [
      "CUSTOMERS",
      data?.users,
      false,
      canViewAffiliateCustomers(user) ? "customers" : undefined,
    ],
    [
      "PROFITS_BALANCE",
      data?.profits,
      true,
      canViewAffiliateTransactions(user) ? "transactions" : undefined,
    ],
    [
      "PEDNING_PROFITS",
      data?.pendingProfits,
      true,
      canViewAffiliateTransactions(user) ? "transactions" : undefined,
    ],
    ["CUSTOMER_TOTAL_SHIPMENTS", data?.shipments?.total, false, undefined],
    [
      "CUSTOMER_DELIVERED_SHIPMENTS",
      data?.shipments?.delivered,
      false,
      undefined,
    ],
    [
      "CUSTOMER_PENDING_SHIPMENTS",
      (data?.shipments?.pending || 0) + (data?.shipments?.processing || 0),
      false,
      undefined,
    ],
  ] as const;
  const priceCarriers = [...(carriers.currentData?.results || [])];
  for (const price of affiliate.prices || [])
    if (!priceCarriers.some((c) => c.id === price.shippingCompanyId))
      priceCarriers.push(
        price.shippingCompany || {
          id: price.shippingCompanyId,
          name: price.shippingCompanyId,
        },
      );
  return (
    <div className="space-y-24" data-testid="affiliate-info">
      {summary.isError ? (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => summary.refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("SUMMARY_ERROR")}
        </Alert>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
          {summaries.map(([title, value, money, tab]) => (
            <Card key={title}>
              <CardContent>
                <Typography>{t(title)}</Typography>
                <Typography className="text-24 font-bold">
                  {summary.isFetching
                    ? "…"
                    : money
                      ? Currency(Number(value) || 0)
                      : value || 0}
                </Typography>
                {tab && (
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={() => onTab(tab)}
                  >
                    {t("VIEW")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        <Card>
          <CardContent className="space-y-16">
            <Typography className="text-20 font-bold">
              {t("ACCOUNT_INFORMATION")}
            </Typography>
            {[
              [
                "NAME",
                `${affiliate.firstName || ""} ${affiliate.lastName || ""}`,
              ],
              ["COMPANY_NAME", affiliate.companyName],
              [
                "ADDRESS",
                [
                  affiliate.country || affiliate.address?.country,
                  affiliate.state || affiliate.address?.state,
                  affiliate.city || affiliate.address?.city,
                ]
                  .map((item) => (item ? localeString(item.name) : ""))
                  .filter(Boolean)
                  .concat(affiliate.address?.street || "")
                  .filter(Boolean)
                  .join(", "),
              ],
              [
                "ACCOUNT_CREATED_AT",
                affiliate.createdAt
                  ? new Date(affiliate.createdAt).toLocaleDateString()
                  : "—",
              ],
              ["TAX_ID", affiliate.taxNumber],
            ].map(([title, value]) => (
              <div key={title}>
                <Typography className="font-semibold">{t(title)}</Typography>
                <Typography className="break-words">{value || "—"}</Typography>
              </div>
            ))}
            <Typography className="font-semibold">
              {t("PHONE_NUMBER")}
            </Typography>
            <a
              href={`https://wa.me/${(affiliate.phone || "").replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              dir="ltr"
            >
              {affiliate.phone}
            </a>
            <Typography className="font-semibold">{t("EMAIL")}</Typography>
            <a href={`mailto:${affiliate.email}`} className="break-all">
              {affiliate.email}
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-16">
            <Typography className="text-20 font-bold">
              {t("AFFILICATE_LINK")}
            </Typography>
            {affiliate.affiliateCode ? (
              <div className="break-all" data-testid="affiliate-referral-link">
                <CopyableText
                  label={t("AFFILICATE_LINK")}
                  text={referralLink(
                    affiliate.affiliateCode,
                    window.location.origin,
                  )}
                  dir="ltr"
                />
              </div>
            ) : (
              <Typography>—</Typography>
            )}
            {user.role !== "employee" && (
              <div className="flex flex-wrap gap-8">
                {(self ||
                  hasOperationPermission("merchants", "view", user)) && (
                  <Button
                    color="primary"
                    variant="outlined"
                    component={Link}
                    to={self ? "/profile" : `/merchants/${affiliate.id}/view`}
                  >
                    {t("VIEW_MAIN_PROFILE")}
                  </Button>
                )}
                {!self && canUpdateMerchant(user) && (
                  <Button
                    color="primary"
                    variant="outlined"
                    component={Link}
                    to={`/merchants/${affiliate.id}`}
                  >
                    {t("EDIT_ACCOUNT")}
                  </Button>
                )}
                {!self && canAdjustMerchantBalance(user) && (
                  <Button
                    color="primary"
                    variant="outlined"
                    component={Link}
                    to={`/transactions/${affiliate.id}/all/new`}
                  >
                    {t("EDIT_BALANCE")}
                  </Button>
                )}
                {!self && canBlockMerchant(user) && (
                  <Button
                    variant="outlined"
                    onClick={() => setDeactivate(true)}
                    color="warning"
                    data-testid="deactivate-affiliate"
                  >
                    {t("DEACTIVATE_AFFILIATE")}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="space-y-16">
          <Typography className="text-20 font-bold">
            {t("SHIPPING_COSTS")} ·{" "}
            {t(
              affiliate.loyaltyType === "custom"
                ? "CUSTOM_PRICES"
                : "NORMAL_PRICES",
            )}
          </Typography>
          {carriers.isError ? (
            <Alert
              severity="error"
              action={
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={() => carriers.refetch()}
                >
                  {t("RETRY")}
                </Button>
              }
            >
              {t("LOAD_CARRIERS_ERROR")}
            </Alert>
          ) : (
            <div className="space-y-12">
              {priceCarriers.map((carrier) => {
                const own = affiliate.prices?.find(
                  (p) => p.shippingCompanyId === carrier.id,
                );
                return (
                  <div
                    key={carrier.id}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-8 border-b-1 pb-12"
                  >
                    <Typography className="font-semibold">
                      {carrier.name}
                    </Typography>
                    <Typography>
                      {t("LOCAL_COST")}:{" "}
                      {Currency(own?.localPrice || carrier.localPrice || 0)}
                    </Typography>
                    <Typography>
                      {t("COD_COST")}:{" "}
                      {Currency(own?.codPrice || carrier.codPrice || 0)}
                    </Typography>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {deactivate && (
        <MerchantActionDialog
          action="affiliate"
          merchant={affiliate}
          onClose={() => setDeactivate(false)}
        />
      )}
    </div>
  );
}
