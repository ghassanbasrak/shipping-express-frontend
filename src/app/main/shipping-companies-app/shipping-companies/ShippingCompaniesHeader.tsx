import { Button, Input, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import {
  selectShippingCompaniesSearchText,
  setShippingCompaniesSearchText,
} from "../store/shippingCompaniesSlice";

function ShippingCompaniesHeader() {
  const { t } = useTranslation("shippingCompaniesApp");
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const searchText = useSelector(selectShippingCompaniesSearchText) as string;
  return (
    <div className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 p-24 sm:p-32 w-full shadow-sm z-20 items-center gap-8">
      <motion.div
        className="flex flex-1 w-full min-w-0"
        initial={{ x: -20 }}
        animate={{ x: 0, transition: { delay: 0.3 } }}
      >
        <Typography className="text-24 md:text-32 font-bold">
          {t("SHIPPING_COMPANIES")}
        </Typography>
      </motion.div>
      <Paper
        component={motion.div}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
        className="flex items-center w-full sm:max-w-256 space-x-8 px-16 rounded-8 border-1 shadow-0"
      >
        <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
        <Input
          placeholder={t("SEARCH_SHIPPING_COMPANIES")}
          className="flex flex-1"
          disableUnderline
          fullWidth
          value={searchText}
          onChange={(event) => dispatch(setShippingCompaniesSearchText(event))}
          inputProps={{
            "aria-label": t("SEARCH_SHIPPING_COMPANIES"),
            "data-testid": "shipping-companies-search",
          }}
        />
      </Paper>
      {hasOperationPermission("shipping-companies", "create", user) && (
        <motion.div
          className="flex self-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
        >
          <Button
            className="whitespace-nowrap mx-4"
            variant="contained"
            color="secondary"
            component={Link}
            to="/shipping-companies/new"
            startIcon={
              <FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
            }
            data-testid="add-shipping-company"
          >
            {t("ADD_NEW_SHIPPING_COMPANY")}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
export default ShippingCompaniesHeader;
