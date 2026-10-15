import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import CountriesHeader from "./CountriesHeader";
import CountriesTable from "./CountriesTable";

function Countries() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<CountriesHeader />}
      content={<CountriesTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}

export default Countries;
