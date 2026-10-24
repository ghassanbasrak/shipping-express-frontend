import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import AuthRequestsHeader from "./AuthRequestsHeader";
import AuthRequestsTable from "./AuthRequestsTable";
export default function AuthRequests() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<AuthRequestsHeader />}
      content={<AuthRequestsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
