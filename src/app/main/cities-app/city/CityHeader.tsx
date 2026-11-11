import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
} from "app/shared-components/feature-header/FeatureHeader";
import { useState } from "react";
import { Typography } from "@mui/material";
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
import ICity, { IShipmentCity } from "../models/ICity";
import {
  useCreateCityMutation,
  useUpdateCityMutation,
  useRemoveCityMutation,
  useSaveShipmentCityMutation,
  useRemoveShipmentCityMutation,
} from "../CitiesApi";
import {
  changedShipmentCities,
  citiesPath,
  displayName,
  shipmentCityPayload,
} from "../Utils";

function CityHeader({ original }: { original?: ICity }) {
  const { shippingCompanyId = "all", stateId = "all" } = useParams();
  const { t } = useTranslation("citiesApp");
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { watch, handleSubmit, formState, setValue, getValues } =
    useFormContext<ICity>();
  const { id, name } = watch();
  const [createCity, creating] = useCreateCityMutation();
  const [updateCity, updating] = useUpdateCityMutation();
  const [removeCity] = useRemoveCityMutation();
  const [saveShipmentCity] = useSaveShipmentCityMutation();
  const [removeShipmentCity] = useRemoveShipmentCityMutation();
  const [loading, setLoading] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [partial, setPartial] = useState(false);
  const message = (text: string, variant: "success" | "error" | "warning") =>
    dispatch(showMessage({ message: text, variant }));

  const handleSaveCity = handleSubmit(async (values) => {
    setLoading(true);
    setPartial(false);
    try {
      const city = await (
        id ? updateCity(values) : createCity(values)
      ).unwrap();
      const cityId = id || city.id || city._id;
      if (!cityId) throw new Error("City response is missing its ID");
      // The parent has been saved. Keep its ID even if a shipping-name request fails.
      setValue("id", cityId);
      const failedMappings: IShipmentCity[] = [];
      for (const row of changedShipmentCities(
        values.shipmentCities,
        original?.shipmentCities,
      )) {
        const input = { ...row, ...shipmentCityPayload(row, cityId) };
        try {
          const saved = await saveShipmentCity(input).unwrap();
          const index = getValues("shipmentCities").findIndex(
            (item) => item.shippingCompanyId === row.shippingCompanyId,
          );
          if (index >= 0)
            setValue(
              `shipmentCities.${index}`,
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
          navigate(`${citiesPath(shippingCompanyId, stateId)}/${cityId}`, {
            replace: true,
            state: { pendingMappings: failedMappings },
          });
        return;
      }
      message(t("CITY_SAVED_SUCCESSFULLY"), "success");
      navigate(citiesPath(shippingCompanyId, stateId));
    } catch {
      message(
        t(
          id
            ? "SOMETHING_WENT_WRONG_WHEN_SAVE_CITY"
            : "SOMETHING_WENT_WRONG_WHEN_ADD_CITY",
        ),
        "error",
      );
    } finally {
      setLoading(false);
    }
  });

  function handleRemoveCity() {
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t("REMOVE_CITY_TITLE")}
            message={t("REMOVE_CITY_MESSAGE")}
            onSubmit={async () => {
              setLoadingRemove(true);
              try {
                await removeCity(id).unwrap();
                let cleanupFailed = false;
                for (const row of original?.shipmentCities ||
                  getValues("shipmentCities") ||
                  []) {
                  if (!row.id && !row._id) continue;
                  try {
                    await removeShipmentCity(row).unwrap();
                  } catch (error) {
                    if ((error as { status?: number })?.status !== 404)
                      cleanupFailed = true;
                  }
                }
                message(
                  t(
                    cleanupFailed
                      ? "PARTIAL_REMOVE"
                      : "CITY_REMOVED_SUCCESSFULLY",
                  ),
                  cleanupFailed ? "warning" : "success",
                );
                navigate(citiesPath(shippingCompanyId, stateId));
              } catch {
                message(t("SOMETHING_WENT_WRONG_WHEN_REMOVE_CITY"), "error");
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
          to={citiesPath(shippingCompanyId, stateId)}
          color="inherit"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="flex mx-4 font-medium">{t("CITIES")}</span>
        </Typography>
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="cities-app">
            {t("CITY_DETAILS")}
          </FeatureHeaderHeading>
          <div className="flex flex-wrap items-center gap-8 mt-8 sm:ps-[72px]">
            <Typography
              color="text.secondary"
              variant="caption"
              className="text-13 leading-relaxed [overflow-wrap:anywhere]"
            >
              {displayName(name) || t("ADD_NEW_CITY")}
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
                onClick={handleRemoveCity}
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
          <LoadingButton
            className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
            variant="contained"
            color="secondary"
            onClick={() => handleSaveCity()}
            startIcon={<Icon type="fa6" name="FaFloppyDisk" size="0.8em" />}
            loadingPosition="start"
            loading={loading}
            disabled={busy || Boolean(id && !formState.isDirty)}
            data-testid="save-city"
          >
            {t(id ? "SAVE_CITY" : "ADD_CITY")}
          </LoadingButton>
        </FeatureHeaderActions>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}

export default CityHeader;
