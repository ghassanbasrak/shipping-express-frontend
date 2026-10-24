import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import AffiliateWithdrawRequestsHeader from "./AffiliateWithdrawRequestsHeader";
import AffiliateWithdrawRequestsTable from "./AffiliateWithdrawRequestsTable";
export default function AffiliateWithdrawRequests() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<AffiliateWithdrawRequestsHeader />}
      content={<AffiliateWithdrawRequestsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
