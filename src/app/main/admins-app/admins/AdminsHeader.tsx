import { Input, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useAppDispatch } from "app/store/hooks";
import {
  selectAdminsSearchText,
  setAdminsSearchText,
} from "../store/adminsSlice";

function AdminsHeader() {
  const { t } = useTranslation("adminsApp");
  const dispatch = useAppDispatch();
  const searchText = useSelector(selectAdminsSearchText) as string;
  return (
    <div className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 p-24 sm:p-32 w-full shadow-sm z-20 items-center gap-8">
      <motion.div
        className="flex flex-1 w-full min-w-0"
        initial={{ x: -20 }}
        animate={{ x: 0, transition: { delay: 0.3 } }}
      >
        <Typography className="text-24 md:text-32 font-bold">
          {t("ADMINS")}
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
          placeholder={t("SEARCH_ADMINS")}
          className="flex flex-1"
          disableUnderline
          fullWidth
          value={searchText}
          onChange={(event) => dispatch(setAdminsSearchText(event))}
          inputProps={{
            "aria-label": t("SEARCH_ADMINS"),
            "data-testid": "admins-search",
          }}
        />
      </Paper>
    </div>
  );
}
export default AdminsHeader;
