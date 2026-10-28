import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import MerchantsHeader from "./MerchantsHeader";
import MerchantsTable from "./MerchantsTable";
export default function Merchants() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<MerchantsHeader />}
      content={<MerchantsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
