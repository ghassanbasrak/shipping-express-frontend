import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderToolbar,
} from "app/shared-components/feature-header/FeatureHeader";
import { Button, Input } from "@mui/material";

import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { selectPlansSearchText, setPlansSearchText } from "../store/plansSlice";

function PlansHeader() {
  const { t } = useTranslation("plansApp");
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const searchText = useSelector(selectPlansSearchText) as string;
  return (
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="plans-app">
            {t("PLANS")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {hasOperationPermission("plans", "create", user) && (
            <>
              <Button
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                variant="contained"
                color="secondary"
                component={Link}
                to="/plans/new"
                startIcon={
                  <FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
                }
                data-testid="add-plan"
              >
                {t("ADD_NEW_PLAN")}
              </Button>
            </>
          )}
        </FeatureHeaderActions>
      </FeatureHeaderRow>
      <FeatureHeaderToolbar
        search={
          <>
            <Input
              placeholder={t("SEARCH_PLANS")}
              className="text-12 min-h-36 flex-1"
              disableUnderline
              fullWidth={true}
              value={searchText}
              onChange={(event) => dispatch(setPlansSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_PLANS"),
                "data-testid": "plans-search",
              }}
            />
          </>
        }
      ></FeatureHeaderToolbar>
    </FeatureHeader>
  );
}
export default PlansHeader;
