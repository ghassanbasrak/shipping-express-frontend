import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  ShipmentOperation,
  ShipmentOperationDialog,
} from "../../shipments-app/shared-components/ShipmentOperations";
import IMerchantDue from "../models/IMerchantDue";
import {
  canUpdateMerchantDues,
  canSettleMerchantDue,
  canReturnMerchantDue,
  toMerchantDueShipment,
} from "../Utils";
export default function MerchantDueActions({ row }: { row: IMerchantDue }) {
  const { t } = useTranslation("merchantDuesApp"),
    user = useAppSelector(selectUser),
    [anchor, setAnchor] = useState<HTMLElement>(null),
    [operation, setOperation] = useState<ShipmentOperation>();
  const update = canUpdateMerchantDues(user),
    items: { operation: ShipmentOperation; label: string }[] = [
      ...(canSettleMerchantDue(user, row)
        ? [{ operation: "settle" as const, label: "SETTLEMENT" }]
        : []),
      ...(canReturnMerchantDue(user, row)
        ? [{ operation: "returned" as const, label: "CONVERT_TO_RETURNED" }]
        : []),
      ...(update && ["canceled", "failed"].includes(row.shipment.status)
        ? [
            {
              operation: "processing" as const,
              label:
                row.shipment.status === "failed"
                  ? "REACTIVIATE_SHIPMENT"
                  : "CONVERT_TO_PROCESSING",
            },
          ]
        : []),
      ...(update
        ? [{ operation: "weight" as const, label: "DISCOUNT_EXTRA_WEIGHT" }]
        : []),
    ];
  return (
    <div className="flex flex-wrap gap-8">
      {row.shipment.trackingUrl &&
        (user.role !== "user" || row.shipment.status !== "failed") && (
          <Button
            color="primary"
            variant="outlined"
            component="a"
            href={row.shipment.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
          >
            {t("TRACK")}
          </Button>
        )}
      {items.length > 0 && (
        <Button
          color="primary"
          variant="outlined"
          size="small"
          aria-label={t("DUE_ACTIONS")}
          aria-controls={anchor ? `merchant-due-menu-${row.id}` : undefined}
          aria-haspopup="menu"
          aria-expanded={!!anchor}
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          {t("ACTIONS")}
        </Button>
      )}
      <Menu
        id={`merchant-due-menu-${row.id}`}
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
      >
        {items.map((item) => (
          <MenuItem
            key={item.operation}
            onClick={() => {
              setAnchor(null);
              setOperation(item.operation);
            }}
          >
            {t(item.label)}
          </MenuItem>
        ))}
      </Menu>
      {operation && (
        <ShipmentOperationDialog
          rows={[toMerchantDueShipment(structuredClone(row))]}
          operation={operation}
          permissionFeature="merchant-dues"
          onClose={() => setOperation(undefined)}
        />
      )}
    </div>
  );
}
