import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import TransactionReportsHeader from "./TransactionReportsHeader";
import TransactionReportsTable from "./TransactionReportsTable";
export default function TransactionReports() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<TransactionReportsHeader />}
      content={<TransactionReportsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
