import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import BalanceErrorsHeader from "./BalanceErrorsHeader";
import BalanceErrorsTable from "./BalanceErrorsTable";
export default function BalanceDuplicationErrors() {
  const mobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<BalanceErrorsHeader />}
      content={<BalanceErrorsTable />}
      scroll={mobile ? "normal" : "content"}
    />
  );
}
