import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import TopupRequestsHeader from "./TopupRequestsHeader";
import TopupRequestsTable from "./TopupRequestsTable";
export default function TopupRequests() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<TopupRequestsHeader />}
      content={<TopupRequestsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
