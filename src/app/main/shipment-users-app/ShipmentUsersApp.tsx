import FusePageSimple from "@fuse/core/FusePageSimple";
import { styled } from "@mui/material/styles";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import ShipmentUsers from "./shipment-users/ShipmentUsers";
import ShipmentUsersHeader from "./shipment-users/ShipmentUsersHeader";
import { isShipmentUserType, shipmentUsersPath } from "./Utils";
const Root = styled(FusePageSimple)(({ theme }) => ({
  "& .FusePageSimple-header": {
    backgroundColor: theme.palette.background.paper,
  },
}));
export default function ShipmentUsersApp() {
  const { type = "all", shipmentUserId } = useParams();
  const user = useAppSelector(selectUser),
    navigate = useNavigate();
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  if (!isShipmentUserType(type))
    return (
      <Navigate
        to={`${shipmentUsersPath("all")}${shipmentUserId ? `/${shipmentUserId}` : ""}`}
        replace
      />
    );
  if (!hasOperationPermission("shipment-users", "view", user))
    return <Navigate to="/home" replace />;
  const sidebarOpen = Boolean(shipmentUserId);
  return (
    <Root
      header={<ShipmentUsersHeader rightSidebarOpen={sidebarOpen} />}
      content={<ShipmentUsers rightSidebarOpen={sidebarOpen} />}
      rightSidebarContent={
        <div
          className="flex flex-col flex-auto min-w-0"
          data-testid="shipment-user-editor"
        >
          <Outlet />
        </div>
      }
      rightSidebarOpen={sidebarOpen}
      rightSidebarVariant="permanent"
      rightSidebarWidth={500}
      rightSidebarOnClose={() => navigate(shipmentUsersPath(type))}
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
