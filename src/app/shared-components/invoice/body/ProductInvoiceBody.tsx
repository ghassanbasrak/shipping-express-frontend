import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import Currency from "src/app/main/utils/currencyFormatter";

function ProductInvoiceBody({ items, hideItemQty = false, hideItemTotal = false }) {
  const { t } = useTranslation("public");
  return (
    <TableContainer>
      <Table className="table" aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>{t("INVOICE_ITEM_PRODUCT")}</TableCell>
            {!hideItemQty && (
              <TableCell align="center">{t("INVOICE_ITEM_QTY")}</TableCell>
            )}
            <TableCell align={hideItemTotal ? "right" : "center"}>
              {t("INVOICE_ITEM_PRICE")}
            </TableCell>
            {!hideItemTotal && (
              <TableCell align="right">{t("INVOICE_ITEM_TOTAL")}</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {items?.map((item, index) => (
            <TableRow key={index}>
              <TableCell scope="row" sx={{ ml: 1, flex: 1 }}>
                {item.name}
              </TableCell>
              {!hideItemQty && (
                <TableCell align="center" sx={{ flex: 1 }}>
                  {item.qty}
                </TableCell>
              )}
              <TableCell
                align={hideItemTotal ? "right" : "center"}
                sx={{ mr: hideItemTotal ? 1 : undefined, flex: 1 }}
              >
                {Currency(item.price)}
              </TableCell>
              {!hideItemTotal && (
                <TableCell align="right" sx={{ mr: 1, flex: 1 }}>
                  {Currency(item.total)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ProductInvoiceBody;
