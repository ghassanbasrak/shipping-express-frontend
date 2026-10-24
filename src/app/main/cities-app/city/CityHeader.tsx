import { useState } from "react";
import { Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import { motion } from "framer-motion";
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
    <div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-8 sm:space-y-0 py-24 sm:py-32 px-24 md:px-32">
      <div className="flex flex-col items-start space-y-8 sm:space-y-0 w-full sm:max-w-full min-w-0">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
        >
          <Typography
            className="flex items-center sm:mb-12"
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
        </motion.div>
        <div className="flex items-center max-w-full">
          <motion.div
            className="flex flex-col min-w-0 mx-8 sm:mx-16"
            initial={{ x: -20 }}
            animate={{ x: 0, transition: { delay: 0.3 } }}
          >
            <Typography className="text-16 sm:text-20 truncate font-semibold">
              {t("CITY_DETAILS")}
            </Typography>
            <Typography variant="caption" className="font-medium">
              {displayName(name) || t("ADD_NEW_CITY")}
            </Typography>
            {partial && (
              <Typography color="error">{t("PARTIAL_SAVE")}</Typography>
            )}
          </motion.div>
        </div>
      </div>
      {id && (
        <>
          <motion.div
            className="flex flex-1 w-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
          >
            <LoadingButton
              className="whitespace-nowrap mx-4"
              variant="contained"
              color="error"
              onClick={handleRemoveCity}
              startIcon={<Icon type="fa6" name="FaRegTrashCan" size="0.8em" />}
              loadingPosition="start"
              loading={loadingRemove}
              disabled={busy}
            >
              {t("REMOVE")}
            </LoadingButton>
          </motion.div>
        </>
      )}
      <motion.div
        className="flex flex-1 w-full"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
      >
        <LoadingButton
          className="whitespace-nowrap mx-4"
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
      </motion.div>
    </div>
  );
}

export default CityHeader;
