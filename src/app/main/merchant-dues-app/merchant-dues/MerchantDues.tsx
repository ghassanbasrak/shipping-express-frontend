import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import MerchantDuesHeader from "./MerchantDuesHeader";
import MerchantDuesTable from "./MerchantDuesTable";
export default function MerchantDues() {
  const mobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<MerchantDuesHeader />}
      content={<MerchantDuesTable />}
      scroll={mobile ? "normal" : "content"}
    />
  );
}
