import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
export default function BalanceErrorsHeader() {
  const { t } = useTranslation("balanceErrorsApp");
  return (
    <div className="flex flex-wrap items-center p-24 sm:p-32 w-full">
      <Typography className="text-24 md:text-32 font-bold">
        {t("BALANCE_DUPLICATION_ERRORS_AND_DATES")}
      </Typography>
    </div>
  );
}
