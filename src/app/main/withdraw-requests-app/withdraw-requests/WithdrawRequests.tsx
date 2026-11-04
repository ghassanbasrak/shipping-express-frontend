import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import WithdrawRequestsHeader from "./WithdrawRequestsHeader";
import WithdrawRequestsTable from "./WithdrawRequestsTable";
export default function WithdrawRequests() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<WithdrawRequestsHeader />}
      content={<WithdrawRequestsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
