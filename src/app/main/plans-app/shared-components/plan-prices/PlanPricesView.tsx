import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import Currency from "src/app/main/utils/currencyFormatter";
import { IPlanPrice } from "../../models/IPlan";

export default function PlanPricesView({
  prices = [],
}: {
  prices?: IPlanPrice[];
}) {
  const { t } = useTranslation("plansApp");
  if (!prices.length) return null;
  return (
    <div className="overflow-auto w-full mt-12">
      <Table size="small" aria-label={t("SHIPPING_COSTS")}>
        <TableHead>
          <TableRow>
            {["COMPANY", "LOCAL_COST", "COD_COST", "RETURN_FEE"].map((key) => (
              <TableCell key={key}>{t(key)}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {prices.map((price, index) => (
            <TableRow
              key={price.id || price._id || price.shippingCompanyId || index}
            >
              <TableCell>
                {price.shippingCompany?.name ||
                  price.shippingCompanyId ||
                  "---"}
              </TableCell>
              {(["localPrice", "codPrice", "returnFees"] as const).map(
                (field) => (
                  <TableCell key={field}>
                    {price[field] != null ? Currency(price[field]) : "---"}
                  </TableCell>
                ),
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
