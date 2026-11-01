import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import LogsHeader from "./LogsHeader";
import LogsTable from "./LogsTable";
export default function Logs() {
  const mobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<LogsHeader />}
      content={<LogsTable />}
      scroll={mobile ? "normal" : "content"}
    />
  );
}
