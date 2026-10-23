import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import AdminsHeader from "./AdminsHeader";
import AdminsTable from "./AdminsTable";

function Admins() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<AdminsHeader />}
      content={<AdminsTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}

export default Admins;
