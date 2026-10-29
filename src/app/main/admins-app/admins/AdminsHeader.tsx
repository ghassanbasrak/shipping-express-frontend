import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderToolbar,
} from "app/shared-components/feature-header/FeatureHeader";
import { Input } from "@mui/material";

import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

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
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="admins-app">
            {t("ADMINS")}
          </FeatureHeaderHeading>
        </div>
      </FeatureHeaderRow>
      <FeatureHeaderToolbar
        search={
          <>
            <Input
              placeholder={t("SEARCH_ADMINS")}
              className="text-12 min-h-36 flex-1"
              disableUnderline
              fullWidth={true}
              value={searchText}
              onChange={(event) => dispatch(setAdminsSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_ADMINS"),
                "data-testid": "admins-search",
              }}
            />
          </>
        }
      ></FeatureHeaderToolbar>
    </FeatureHeader>
  );
}
export default AdminsHeader;
