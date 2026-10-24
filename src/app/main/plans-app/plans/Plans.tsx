import FusePageSimple from "@fuse/core/FusePageSimple";
import { styled } from "@mui/material/styles";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import PlansContent from "./PlansContent";
import PlansHeader from "./PlansHeader";

const Root = styled(FusePageSimple)(({ theme }) => ({
  "& .FusePageSimple-header": {
    backgroundColor: theme.palette.background.paper,
    borderRadius: "8px",
  },
}));

function Plans() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <Root
      header={<PlansHeader />}
      content={<PlansContent />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
export default Plans;
