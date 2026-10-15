import FusePageSimple from "@fuse/core/FusePageSimple";
import { styled } from "@mui/material/styles";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import ShippingCompaniesContent from "./ShippingCompaniesContent";
import ShippingCompaniesHeader from "./ShippingCompaniesHeader";

const Root = styled(FusePageSimple)(({ theme }) => ({
  "& .FusePageSimple-header": {
    backgroundColor: theme.palette.background.paper,
    borderRadius: "8px",
  },
}));

function ShippingCompanies() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  return (
    <Root
      header={<ShippingCompaniesHeader />}
      content={<ShippingCompaniesContent />}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
export default ShippingCompanies;
