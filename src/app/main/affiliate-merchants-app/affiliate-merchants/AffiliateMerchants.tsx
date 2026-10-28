import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import AffiliateMerchantsHeader from "./AffiliateMerchantsHeader";
import AffiliateMerchantsTable from "./AffiliateMerchantsTable";
export default function AffiliateMerchants() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<AffiliateMerchantsHeader />}
      content={<AffiliateMerchantsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
