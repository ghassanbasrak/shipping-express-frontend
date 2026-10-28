import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import CancelShipmentRequestsHeader from "./CancelShipmentRequestsHeader";
import CancelShipmentRequestsTable from "./CancelShipmentRequestsTable";
export default function CancelShipmentRequests() {
  const mobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<CancelShipmentRequestsHeader />}
      content={<CancelShipmentRequestsTable />}
      scroll={mobile ? "normal" : "content"}
    />
  );
}
