import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
} from "app/shared-components/feature-header/FeatureHeader";
import { useState } from "react";
import { Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";

import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import Icon from "app/shared-components/Icon";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "app/store/hooks";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import AlertDialog from "app/shared-components/alert-dialog/AlertDialog";
import ICountry, { IShipmentCountry } from "../models/ICountry";
import {
  useCreateCountryMutation,
  useUpdateCountryMutation,
  useRemoveCountryMutation,
  useSaveShipmentCountryMutation,
  useRemoveShipmentCountryMutation,
} from "../CountriesApi";
import {
  changedShipmentCountries,
  countriesPath,
  displayName,
  shipmentCountryPayload,
} from "../Utils";

function CountryHeader({ original }: { original?: ICountry }) {
  const { shippingCompanyId = "all" } = useParams();
  const { t } = useTranslation("countriesApp");
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { watch, handleSubmit, formState, setValue, getValues } =
    useFormContext<ICountry>();
  const { id, name } = watch();
  const [createCountry, creating] = useCreateCountryMutation();
  const [updateCountry, updating] = useUpdateCountryMutation();
  const [removeCountry] = useRemoveCountryMutation();
  const [saveShipmentCountry] = useSaveShipmentCountryMutation();
  const [removeShipmentCountry] = useRemoveShipmentCountryMutation();
  const [loading, setLoading] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [partial, setPartial] = useState(false);
  const message = (text: string, variant: "success" | "error" | "warning") =>
    dispatch(showMessage({ message: text, variant }));

  const handleSaveCountry = handleSubmit(async (values) => {
    setLoading(true);
    setPartial(false);
    try {
      const country = await (
        id ? updateCountry(values) : createCountry(values)
      ).unwrap();
      const countryId = id || country.id || country._id;
      if (!countryId) throw new Error("Country response is missing its ID");
      // The parent has been saved. Keep its ID even if a shipping-name request fails.
      setValue("id", countryId);
      const failedMappings: IShipmentCountry[] = [];
      for (const row of changedShipmentCountries(
        values.shipmentCountries,
        original?.shipmentCountries,
      )) {
        const input = { ...row, ...shipmentCountryPayload(row, countryId) };
        try {
          const saved = await saveShipmentCountry(input).unwrap();
          const index = getValues("shipmentCountries").findIndex(
            (item) => item.shippingCompanyId === row.shippingCompanyId,
          );
          if (index >= 0)
            setValue(
              `shipmentCountries.${index}`,
              { ...input, ...saved },
              { shouldDirty: true },
            );
        } catch {
          failedMappings.push(input);
        }
      }
      if (failedMappings.length) {
        message(t("PARTIAL_SAVE"), "warning");
        setPartial(true);
        if (!id)
          navigate(`${countriesPath(shippingCompanyId)}/${countryId}`, {
            replace: true,
            state: { pendingMappings: failedMappings },
          });
        return;
      }
      message(t("COUNTRY_SAVED_SUCCESSFULLY"), "success");
      navigate(countriesPath(shippingCompanyId));
    } catch {
      message(
        t(
          id
            ? "SOMETHING_WENT_WRONG_WHEN_SAVE_COUNTRY"
            : "SOMETHING_WENT_WRONG_WHEN_ADD_COUNTRY",
        ),
        "error",
      );
    } finally {
      setLoading(false);
    }
  });

  function handleRemoveCountry() {
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t("REMOVE_COUNTRY_TITLE")}
            message={t("REMOVE_COUNTRY_MESSAGE")}
            onSubmit={async () => {
              setLoadingRemove(true);
              try {
                await removeCountry(id).unwrap();
                let cleanupFailed = false;
                for (const row of original?.shipmentCountries ||
                  getValues("shipmentCountries") ||
                  []) {
                  if (!row.id && !row._id) continue;
                  try {
                    await removeShipmentCountry(row).unwrap();
                  } catch (error) {
                    if ((error as { status?: number })?.status !== 404)
                      cleanupFailed = true;
                  }
                }
                message(
                  t(
                    cleanupFailed
                      ? "PARTIAL_REMOVE"
                      : "COUNTRY_REMOVED_SUCCESSFULLY",
                  ),
                  cleanupFailed ? "warning" : "success",
                );
                navigate(countriesPath(shippingCompanyId));
              } catch {
                message(t("SOMETHING_WENT_WRONG_WHEN_REMOVE_COUNTRY"), "error");
              } finally {
                setLoadingRemove(false);
              }
            }}
          />
        ),
      }),
    );
  }

  const busy =
    loading || loadingRemove || creating.isLoading || updating.isLoading;
  return (
    <FeatureHeader>
      <div className="flex items-center justify-between gap-8 min-w-0">
        <Typography
          className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
          component={Link}
          role="button"
          to={countriesPath(shippingCompanyId)}
          color="inherit"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="flex mx-4 font-medium">{t("COUNTRIES")}</span>
        </Typography>
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="countries-app">
            {t("COUNTRY_DETAILS")}
          </FeatureHeaderHeading>
          <div className="flex flex-wrap items-center gap-8 mt-8 sm:ps-[72px]">
            <Typography
              color="text.secondary"
              variant="caption"
              className="text-13 leading-relaxed [overflow-wrap:anywhere]"
            >
              {displayName(name) || t("ADD_NEW_COUNTRY")}
            </Typography>
            {partial && (
              <>
                <Typography
                  className="text-13 leading-relaxed [overflow-wrap:anywhere]"
                  color="error"
                >
                  {t("PARTIAL_SAVE")}
                </Typography>
              </>
            )}
          </div>
        </div>
        <FeatureHeaderActions>
          {id && (
            <>
              <LoadingButton
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                variant="contained"
                color="error"
                onClick={handleRemoveCountry}
                startIcon={
                  <Icon type="fa6" name="FaRegTrashCan" size="0.8em" />
                }
                loadingPosition="start"
                loading={loadingRemove}
                disabled={busy}
              >
                {t("REMOVE")}
              </LoadingButton>
            </>
          )}
          {id && (
            <>
              <Button
                color="primary"
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                component={Link}
                to={`/states/${shippingCompanyId}/${id}`}
                variant="outlined"
                disabled={busy}
              >
                {t("VIEW_STATES")}
              </Button>
            </>
          )}
          <LoadingButton
            className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
            variant="contained"
            color="secondary"
            onClick={() => handleSaveCountry()}
            startIcon={<Icon type="fa6" name="FaFloppyDisk" size="0.8em" />}
            loadingPosition="start"
            loading={loading}
            disabled={busy || Boolean(id && !formState.isDirty)}
            data-testid="save-country"
          >
            {t(id ? "SAVE_COUNTRY" : "ADD_COUNTRY")}
          </LoadingButton>
        </FeatureHeaderActions>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}

export default CountryHeader;
