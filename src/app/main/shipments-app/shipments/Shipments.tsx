import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import ShipmentsHeader from "./ShipmentsHeader";
import ShipmentsTable from "./ShipmentsTable";
export default function Shipments() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<ShipmentsHeader />}
      content={<ShipmentsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
