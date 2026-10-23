import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import AlertsHeader from "./AlertsHeader";
import AlertsTable from "./AlertsTable";

function Alerts() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<AlertsHeader />}
      content={<AlertsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}

export default Alerts;
