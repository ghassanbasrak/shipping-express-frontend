import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import ApplicationsHeader from "./ApplicationsHeader";
import ApplicationsTable from "./ApplicationsTable";
export default function Applications() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<ApplicationsHeader />}
      content={<ApplicationsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
