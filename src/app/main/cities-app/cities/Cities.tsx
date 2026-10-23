import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import CitiesHeader from "./CitiesHeader";
import CitiesTable from "./CitiesTable";

function Cities() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<CitiesHeader />}
      content={<CitiesTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}

export default Cities;
