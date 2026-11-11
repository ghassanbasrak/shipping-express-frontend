import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderToolbar,
} from "app/shared-components/feature-header/FeatureHeader";
import { Button, Input, TextField, MenuItem } from "@mui/material";

import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import {
  selectShipmentUsersSearchText,
  setShipmentUsersSearchText,
} from "../store/shipmentUsersSlice";
import {
  shipmentUserTypes,
  toShipmentUserTypeTitle,
  shipmentUsersPath,
} from "../Utils";

export default function ShipmentUsersHeader({
  rightSidebarOpen = false,
}: {
  rightSidebarOpen?: boolean;
}) {
  const { t } = useTranslation("shipmentUsersApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    navigate = useNavigate();
  const { type = "all" } = useParams();
  const searchText = useSelector(selectShipmentUsersSearchText) as string;
  return (
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="shipment-users-app">
            {t("SHIPMENT_USERS")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {!rightSidebarOpen &&
            hasOperationPermission("shipment-users", "create", user) && (
              <>
                <Button
                  component={Link}
                  to={`${shipmentUsersPath(type)}/new`}
                  variant="contained"
                  color="secondary"
                  className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                  data-testid="add-shipment-user"
                  startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
                >
                  {t(
                    type === "all"
                      ? "ADD_NEW_SHIPMENT_USER"
                      : `ADD_NEW_${toShipmentUserTypeTitle(type)}`,
                  )}
                </Button>
              </>
            )}
        </FeatureHeaderActions>
      </FeatureHeaderRow>
      <FeatureHeaderToolbar
        search={
          <>
            <Input
              className="text-12 min-h-36 flex-1"
              fullWidth={true}
              disableUnderline
              placeholder={t("SEARCH_SHIPMENT_USERS")}
              value={searchText}
              onChange={(event) => dispatch(setShipmentUsersSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_SHIPMENT_USERS"),
                "data-testid": "shipment-users-search",
              }}
            />
          </>
        }
      >
        <TextField
          className="min-w-[112px] max-w-full"
          select
          size="small"
          label={t("TYPE")}
          value={type}
          onChange={(event) => navigate(shipmentUsersPath(event.target.value))}
          inputProps={{ "data-testid": "shipment-users-type" }}
        >
          <MenuItem value="all">{t("ALL")}</MenuItem>
          {Object.values(shipmentUserTypes).map((value) => (
            <MenuItem key={value} value={value}>
              {t(toShipmentUserTypeTitle(value))}
            </MenuItem>
          ))}
        </TextField>
      </FeatureHeaderToolbar>
    </FeatureHeader>
  );
}
