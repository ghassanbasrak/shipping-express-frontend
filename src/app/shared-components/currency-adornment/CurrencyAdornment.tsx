import { InputAdornment } from "@mui/material";
import { getCurrentCurrency } from "src/app/main/utils/currencyFormatter";
export default function CurrencyAdornment() {
  return <InputAdornment position="end">{getCurrentCurrency()}</InputAdornment>;
}
