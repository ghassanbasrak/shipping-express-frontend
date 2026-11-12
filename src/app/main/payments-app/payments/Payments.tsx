import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import PaymentsHeader from "./PaymentsHeader";
import PaymentsTable from "./PaymentsTable";
export default function Payments() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<PaymentsHeader />}
      content={<PaymentsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
