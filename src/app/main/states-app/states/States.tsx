import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import StatesHeader from "./StatesHeader";
import StatesTable from "./StatesTable";

function States() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <FusePageCarded
      header={<StatesHeader />}
      content={<StatesTable />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}

export default States;
