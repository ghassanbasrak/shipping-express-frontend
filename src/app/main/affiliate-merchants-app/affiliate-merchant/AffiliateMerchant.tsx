import { Alert, Button, Tab, Tabs } from "@mui/material";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { useGetAffiliateMerchantQuery } from "../AffiliateMerchantsApi";
import {
  affiliateMerchantTabs,
  toAffiliateMerchantTabTitle,
  canViewAffiliates,
  canViewAffiliateCustomers,
  canViewAffiliateTransactions,
  canViewAffiliateWithdrawals,
} from "../Utils";
import AffiliateMerchantHeader from "./AffiliateMerchantHeader";
import AffiliateInfoTab from "./tabs/AffiliateInfoTab";
import CustomersTab from "./tabs/CustomersTab";
import AffiliateTransactionsTab from "./tabs/AffiliateTransactionsTab";
import AffiliateWithdrawRequestsHeader from "../../affiliate-withdraw-requests-app/affiliate-withdraw-requests/AffiliateWithdrawRequestsHeader";
import AffiliateWithdrawRequestsTable from "../../affiliate-withdraw-requests-app/affiliate-withdraw-requests/AffiliateWithdrawRequestsTable";
export default function AffiliateMerchant() {
  const { affiliateMerchantId, tab = "info" } = useParams(),
    user = useAppSelector(selectUser),
    self = user.role === "user",
    id = self ? user.id : affiliateMerchantId,
    allowed = canViewAffiliates(user),
    { t } = useTranslation("affiliateMerchantsApp"),
    navigate = useNavigate(),
    mobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg")),
    query = useGetAffiliateMerchantQuery(self ? "me" : id, {
      skip: !allowed || !id || id === "new",
      refetchOnMountOrArgChange: true,
    }),
    affiliate = query.currentData;
  if (!allowed) return <Navigate to="/home" replace />;
  if (id === "new") return <Navigate to="/affiliate-merchants" replace />;
  if (query.isError || (!query.isFetching && !affiliate))
    return (
      <div className="p-24">
        <Alert severity="error">{t("NO_SUCH_MERCHANT")}</Alert>
        <Button onClick={() => query.refetch()}>{t("RETRY")}</Button>
      </div>
    );
  if (!affiliate) return <FuseLoading />;
  if (!affiliate.isAffiliate)
    return (
      <Navigate
        to={
          self
            ? "/profile"
            : hasOperationPermission("merchants", "view", user)
              ? `/merchants/${id}/view`
              : "/affiliate-merchants"
        }
        replace
      />
    );
  const tabs = Object.values(affiliateMerchantTabs).filter(
      (value) =>
        value === "info" ||
        (value === "customers"
          ? canViewAffiliateCustomers(user)
          : value === "transactions"
            ? canViewAffiliateTransactions(user)
            : canViewAffiliateWithdrawals(user)),
    ),
    active = tabs.includes(tab as (typeof tabs)[number]) ? tab : "info",
    go = (value: string) =>
      navigate(
        self
          ? `/affiliate-profile/${value}`
          : `/affiliate-merchants/${id}/${value}`,
      );
  return (
    <FusePageCarded
      header={<AffiliateMerchantHeader affiliate={affiliate} self={self} />}
      content={
        <>
          <Tabs
            value={active}
            onChange={(_, value) => go(value)}
            variant="scrollable"
            scrollButtons="auto"
            classes={{ root: "w-full h-64 border-b-1" }}
          >
            {tabs.map((value) => (
              <Tab
                key={value}
                value={value}
                label={t(toAffiliateMerchantTabTitle(value))}
              />
            ))}
          </Tabs>
          <div className="p-16 sm:p-24" key={`${id}/${active}`}>
            {active === "info" ? (
              <AffiliateInfoTab
                affiliate={{
                  ...affiliate,
                  id: affiliate.id || affiliate._id || id,
                }}
                onTab={go}
              />
            ) : active === "customers" ? (
              <CustomersTab
                affiliate={{
                  ...affiliate,
                  id: affiliate.id || affiliate._id || id,
                }}
              />
            ) : active === "transactions" ? (
              <AffiliateTransactionsTab affiliateId={id} />
            ) : (
              <>
                <AffiliateWithdrawRequestsHeader
                  fixedUserId={id}
                  viewFeature="withdraw-requests"
                />
                <AffiliateWithdrawRequestsTable
                  fixedUserId={id}
                  viewFeature="withdraw-requests"
                />
              </>
            )}
          </div>
        </>
      }
      scroll={mobile ? "normal" : "content"}
    />
  );
}
