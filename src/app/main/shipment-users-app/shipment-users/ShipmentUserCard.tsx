import { Button, Chip, Paper, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { displayName } from "../../countries-app/Utils";
import IShipmentUser from "../models/IShipmentUser";
import {
  shipmentUserTypes,
  toShipmentUserTypeTitle,
  toShipmentUserTypeColor,
  shipmentUsersPath,
} from "../Utils";
export default function ShipmentUserCard({
  shipmentUser: row,
  handleRemoveItem,
  loadingRemove = false,
}: {
  shipmentUser: IShipmentUser;
  handleRemoveItem: (row: IShipmentUser) => void;
  loadingRemove?: boolean;
}) {
  const { t } = useTranslation("shipmentUsersApp"),
    user = useAppSelector(selectUser),
    { type = "all" } = useParams();
  const place = [
    row.country || row.address?.country,
    row.state || row.address?.state,
    row.city || row.address?.city,
  ]
    .map((item) => displayName(item?.name))
    .filter(Boolean)
    .join(", ");
  const count =
    row.type === shipmentUserTypes.sender
      ? row.senderShipmentsCount
      : row.receiverShipmentsCount;
  return (
    <Paper
      className="flex flex-col h-full rounded-16 overflow-hidden shadow min-w-0"
      data-testid={`shipment-user-${row.id}`}
    >
      <div className="p-16 flex-1 space-y-8 min-w-0">
        <div className="flex flex-wrap gap-8 items-center justify-between">
          <Typography className="text-18 font-medium break-words">
            {row.fullName}
          </Typography>
          <Chip
            size="small"
            label={t(toShipmentUserTypeTitle(row.type))}
            color={toShipmentUserTypeColor(row.type)}
          />
        </div>
        <Typography color="text.secondary" className="text-12">
          {place}
        </Typography>
        <Typography className="break-all text-14" dir="ltr">
          {row.email || t("NO_EMAIL_ADDRESS")}
        </Typography>
        <Typography dir="ltr" className="text-14">
          {row.phone}
        </Typography>
        {row.phone1 && (
          <Typography dir="ltr" className="text-14">
            {row.phone1}
          </Typography>
        )}
        <Chip
          size="small"
          label={`${count ?? 0} ${t("sHIPMENTS")}`}
          color="secondary"
        />
      </div>
      <div className="flex gap-8 items-center justify-end p-8 border-t-1">
        {hasOperationPermission("shipment-users", "delete", user) && (
          <LoadingButton
            color="error"
            loading={loadingRemove}
            onClick={() => handleRemoveItem(row)}
            data-testid={`remove-shipment-user-${row.id}`}
          >
            {t("REMOVE")}
          </LoadingButton>
        )}
        <Button component={Link} to={`${shipmentUsersPath(type)}/${row.id}`}>
          {t(
            hasOperationPermission("shipment-users", "update", user)
              ? "EDIT"
              : "VIEW",
          )}
        </Button>
      </div>
    </Paper>
  );
}
