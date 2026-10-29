import { Box, Button, Typography, alpha } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import IShippingCompany from "../../models/IShippingCompany";
import { shippingCompanySummaryLinks } from "../../Utils";

function ShippingCompanySummary({
  shippingCompany: company,
}: {
  shippingCompany?: IShippingCompany;
}) {
  const { t } = useTranslation("shippingCompaniesApp");
  const user = useAppSelector(selectUser);
  if (!company) return null;
  return (
    <section>
      <Box
        component="div"
        className="py-8 px-16 my-16 w-full rounded-lg"
        sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}
      >
        <Typography className="text-17 font-bold">{t("SUMMARY")}</Typography>
      </Box>
      {shippingCompanySummaryLinks.map((link) => (
        <div
          key={link.title}
          className="flex items-center justify-between gap-16 my-8"
        >
          <Typography>{t(link.title)}</Typography>
          <div className="flex items-center gap-8">
            <Typography>{company[link.count] ?? "—"}</Typography>
            <Button
              color="primary"
              variant="outlined"
              size="small"
              component={Link}
              to={link.path(company.id)}
              disabled={
                !link.available || (link.adminOnly && user.role !== "admin")
              }
            >
              {t(`VIEW_${link.title}`)}
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}
export default ShippingCompanySummary;
