import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import TransactionsHeader from "./TransactionsHeader";
import TransactionsTable from "./TransactionsTable";
export default function Transactions() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<TransactionsHeader />}
      content={<TransactionsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
