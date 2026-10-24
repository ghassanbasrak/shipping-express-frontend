import { useState } from "react";
import { Alert } from "@mui/material";
import { useTranslation } from "react-i18next";
import CustomDialog from "app/shared-components/custom-dialog/CustomDialog";
import { useAppDispatch } from "app/store/hooks";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { closeDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import ICity from "../../models/ICity";
import {
  useRemoveCityMutation,
  useLazyGetShipmentCitiesQuery,
  useRemoveShipmentCityMutation,
} from "../../CitiesApi";

function RemoveCityDialog({ city }: { city: ICity }) {
  const { t } = useTranslation("citiesApp");
  const dispatch = useAppDispatch();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [getMappings] = useLazyGetShipmentCitiesQuery();
  const [removeCity] = useRemoveCityMutation();
  const [removeMapping] = useRemoveShipmentCityMutation();
  return (
    <CustomDialog
      disableCloseWhenSubmit
      title={t("REMOVE_CITY_TITLE")}
      message={
        <>
          {t("REMOVE_CITY_MESSAGE")}
          {error && (
            <Alert severity="error">
              {t("SOMETHING_WENT_WRONG_WHEN_REMOVE_CITY")}
            </Alert>
          )}
        </>
      }
      submitButtonLoading={loading}
      onSubmit={async () => {
        setLoading(true);
        setError(false);
        try {
          const mappings = await getMappings(city.id).unwrap();
          await removeCity(city.id).unwrap();
          let failed = false;
          for (const row of mappings.results) {
            if (!row.id && !row._id) continue;
            try {
              await removeMapping(row).unwrap();
            } catch (error) {
              if ((error as { status?: number })?.status !== 404) failed = true;
            }
          }
          dispatch(
            showMessage({
              message: t(
                failed ? "PARTIAL_REMOVE" : "CITY_REMOVED_SUCCESSFULLY",
              ),
              variant: failed ? "warning" : "success",
            }),
          );
          dispatch(closeDialog());
        } catch {
          setError(true);
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}
export default RemoveCityDialog;
