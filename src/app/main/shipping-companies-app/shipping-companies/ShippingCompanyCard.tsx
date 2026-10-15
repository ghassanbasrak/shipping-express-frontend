import { Box, Button, Chip, Divider, Paper, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import Currency from "src/app/main/utils/currencyFormatter";
import IShippingCompany from "../models/IShippingCompany";
import {
  shippingMethods,
  toShippingMethodTitle,
  toShippingMethodColor,
  shippingCompanySummaryLinks,
} from "../Utils";

function ShippingCompanyCard({
  shippingCompany: company,
  loadingChangeActive,
  handleChangeActiveItem,
}: {
  shippingCompany: IShippingCompany;
  loadingChangeActive: boolean;
  handleChangeActiveItem: (company: IShippingCompany) => void;
}) {
  const { t } = useTranslation("shippingCompaniesApp");
  const user = useAppSelector(selectUser);
  const canUpdate = hasOperationPermission(
    "shipping-companies",
    "update",
    user,
  );
  return (
    <Paper
      className="flex flex-col h-full rounded-16 overflow-hidden shadow"
      data-testid={`shipping-company-${company.id}`}
    >
      <div className="p-16 flex-1">
        <div className="flex items-center justify-between gap-8">
          <Typography className="text-18 font-medium">
            {company.name}
          </Typography>
          {company.logoUrl && (
            <img
              className="h-32 max-w-96 object-contain"
              src={company.logoUrl}
              alt={company.name}
            />
          )}
        </div>
        <Box className="flex flex-wrap gap-8 my-12">
          <Chip
            label={`${company.shipmentsCount ?? 0} ${t("sHIPMENTS")}`}
            size="small"
            color="secondary"
          />
          <Chip
            label={t(company.isActive ? "ACTIVE" : "INACTIVE")}
            size="small"
            color={company.isActive ? "success" : "default"}
          />
        </Box>
        <Divider />
        <div className="flex items-center justify-between mt-12">
          <Typography>{t("LOCAL_SHIPPING")}</Typography>
          <Typography>
            {company.shippingMethods?.includes(shippingMethods.local)
              ? Currency(company.localPrice ?? 0)
              : "—"}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-8 mt-16">
          {(company.shippingMethods || []).map((method) => (
            <Chip
              key={method}
              label={t(toShippingMethodTitle(method))}
              size="small"
              sx={{ bgcolor: toShippingMethodColor(method), color: "#111" }}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 p-8 border-t-1">
        {canUpdate && (
          <LoadingButton
            color={company.isActive ? "error" : "success"}
            loading={loadingChangeActive}
            onClick={() => handleChangeActiveItem(company)}
            data-testid={`toggle-shipping-company-${company.id}`}
          >
            {t(company.isActive ? "DEACTIVATE" : "ACTIVATE")}
          </LoadingButton>
        )}
        <Button component={Link} to={`/shipping-companies/${company.id}`}>
          {t(canUpdate ? "EDIT" : "VIEW")}
        </Button>
        <Button
          component={Link}
          to={`/shipments/${company.id}/all`}
          disabled={
            !shippingCompanySummaryLinks.find(
              (link) => link.title === "SHIPMENTS",
            ).available || !hasOperationPermission("shipments", "view", user)
          }
        >
          {t("SHIPMENTS")}
        </Button>
      </div>
    </Paper>
  );
}
export default ShippingCompanyCard;
