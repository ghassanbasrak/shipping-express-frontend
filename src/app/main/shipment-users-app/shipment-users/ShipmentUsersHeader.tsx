import {
  Button,
  Input,
  Paper,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
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
    <div
      className={`flex ${rightSidebarOpen ? "flex-col" : "flex-col sm:flex-row"} gap-16 p-24 sm:p-32 w-full items-center`}
    >
      <motion.div
        className={`flex flex-1 min-w-0 ${rightSidebarOpen ? "w-full" : ""}`}
        initial={{ x: -20 }}
        animate={{ x: 0, transition: { delay: 0.3 } }}
      >
        <Typography className="text-24 md:text-32 font-bold">
          {t("SHIPMENT_USERS")}
        </Typography>
      </motion.div>
      <div className="flex flex-wrap gap-8 items-center justify-end w-full sm:w-auto">
        <TextField
          select
          size="small"
          label={t("TYPE")}
          value={type}
          onChange={(event) => navigate(shipmentUsersPath(event.target.value))}
          inputProps={{ "data-testid": "shipment-users-type" }}
          sx={{ minWidth: 112 }}
        >
          <MenuItem value="all">{t("ALL")}</MenuItem>
          {Object.values(shipmentUserTypes).map((value) => (
            <MenuItem key={value} value={value}>
              {t(toShipmentUserTypeTitle(value))}
            </MenuItem>
          ))}
        </TextField>
        <Paper className="flex items-center flex-1 gap-8 px-16 rounded-8 border-1 shadow-0 sm:max-w-256">
          <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
          <Input
            fullWidth
            disableUnderline
            placeholder={t("SEARCH_SHIPMENT_USERS")}
            value={searchText}
            onChange={(event) => dispatch(setShipmentUsersSearchText(event))}
            inputProps={{
              "aria-label": t("SEARCH_SHIPMENT_USERS"),
              "data-testid": "shipment-users-search",
            }}
          />
        </Paper>
        {!rightSidebarOpen &&
          hasOperationPermission("shipment-users", "create", user) && (
            <Button
              component={Link}
              to={`${shipmentUsersPath(type)}/new`}
              variant="contained"
              color="secondary"
              className="whitespace-nowrap"
              data-testid="add-shipment-user"
              startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
            >
              {t(
                type === "all"
                  ? "ADD_NEW_SHIPMENT_USER"
                  : `ADD_NEW_${toShipmentUserTypeTitle(type)}`,
              )}
            </Button>
          )}
      </div>
    </div>
  );
}
