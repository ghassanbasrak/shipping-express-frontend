import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import VerificationRequestsHeader from "./VerificationRequestsHeader";
import VerificationRequestsTable from "./VerificationRequestsTable";
export default function VerificationRequests() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<VerificationRequestsHeader />}
      content={<VerificationRequestsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
