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
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="shipping-companies-app">
            {t("SHIPPING_COMPANIES")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {hasOperationPermission("shipping-companies", "create", user) && (
            <>
              <Button
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
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
            </>
          )}
        </FeatureHeaderActions>
      </FeatureHeaderRow>
      <FeatureHeaderToolbar
        search={
          <>
            <Input
              placeholder={t("SEARCH_SHIPPING_COMPANIES")}
              className="text-12 min-h-36 flex-1"
              disableUnderline
              fullWidth={true}
              value={searchText}
              onChange={(event) =>
                dispatch(setShippingCompaniesSearchText(event))
              }
              inputProps={{
                "aria-label": t("SEARCH_SHIPPING_COMPANIES"),
                "data-testid": "shipping-companies-search",
              }}
            />
          </>
        }
      ></FeatureHeaderToolbar>
    </FeatureHeader>
  );
}
export default ShippingCompaniesHeader;
