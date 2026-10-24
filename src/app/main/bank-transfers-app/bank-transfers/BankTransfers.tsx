import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import BankTransfersHeader from "./BankTransfersHeader";
import BankTransfersTable from "./BankTransfersTable";
export default function BankTransfers() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<BankTransfersHeader />}
      content={<BankTransfersTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
