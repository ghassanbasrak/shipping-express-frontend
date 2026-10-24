import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import PackageRequestsHeader from "./PackageRequestsHeader";
import PackageRequestsTable from "./PackageRequestsTable";
export default function PackageRequests() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<PackageRequestsHeader />}
      content={<PackageRequestsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
