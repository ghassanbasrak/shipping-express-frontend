import {
  Container,
  InputBase,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import Currency from "src/app/main/utils/currencyFormatter";

function PaymentInvoiceBody({ items }) {
  const { t } = useTranslation("public");
  return (
    <TableContainer>
      <Table className="table" aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>{t("INVOICE_ITEM_DESCRIPTION")}</TableCell>
            <TableCell align="right">{t("INVOICE_ITEM_PRICE")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items?.map((item, index) => (
            <TableRow key={index}>
              <TableCell scope="row" sx={{ ml: 1, flex: 1 }}>
                {item.name}
              </TableCell>
              <TableCell align="right" sx={{ mr: 1, flex: 1 }}>
                {Currency(item?.price)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default PaymentInvoiceBody;
