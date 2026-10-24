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
import IState, { IShipmentState } from "../models/IState";
import {
  useCreateStateMutation,
  useUpdateStateMutation,
  useRemoveStateMutation,
  useSaveShipmentStateMutation,
  useRemoveShipmentStateMutation,
} from "../StatesApi";
import {
  changedShipmentStates,
  statesPath,
  displayName,
  shipmentStatePayload,
} from "../Utils";

function StateHeader({ original }: { original?: IState }) {
  const { shippingCompanyId = "all", countryId = "all" } = useParams();
  const { t } = useTranslation("statesApp");
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { watch, handleSubmit, formState, setValue, getValues } =
    useFormContext<IState>();
  const { id, name } = watch();
  const [createState, creating] = useCreateStateMutation();
  const [updateState, updating] = useUpdateStateMutation();
  const [removeState] = useRemoveStateMutation();
  const [saveShipmentState] = useSaveShipmentStateMutation();
  const [removeShipmentState] = useRemoveShipmentStateMutation();
  const [loading, setLoading] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [partial, setPartial] = useState(false);
  const message = (text: string, variant: "success" | "error" | "warning") =>
    dispatch(showMessage({ message: text, variant }));

  const handleSaveState = handleSubmit(async (values) => {
    setLoading(true);
    setPartial(false);
    try {
      const state = await (
        id ? updateState(values) : createState(values)
      ).unwrap();
      const stateId = id || state.id || state._id;
      if (!stateId) throw new Error("State response is missing its ID");
      // The parent has been saved. Keep its ID even if a shipping-name request fails.
      setValue("id", stateId);
      const failedMappings: IShipmentState[] = [];
      for (const row of changedShipmentStates(
        values.shipmentStates,
        original?.shipmentStates,
      )) {
        const input = { ...row, ...shipmentStatePayload(row, stateId) };
        try {
          const saved = await saveShipmentState(input).unwrap();
          const index = getValues("shipmentStates").findIndex(
            (item) => item.shippingCompanyId === row.shippingCompanyId,
          );
          if (index >= 0)
            setValue(
              `shipmentStates.${index}`,
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
          navigate(`${statesPath(shippingCompanyId, countryId)}/${stateId}`, {
            replace: true,
            state: { pendingMappings: failedMappings },
          });
        return;
      }
      message(t("STATE_SAVED_SUCCESSFULLY"), "success");
      navigate(statesPath(shippingCompanyId, countryId));
    } catch {
      message(
        t(
          id
            ? "SOMETHING_WENT_WRONG_WHEN_SAVE_STATE"
            : "SOMETHING_WENT_WRONG_WHEN_ADD_STATE",
        ),
        "error",
      );
    } finally {
      setLoading(false);
    }
  });

  function handleRemoveState() {
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t("REMOVE_STATE_TITLE")}
            message={t("REMOVE_STATE_MESSAGE")}
            onSubmit={async () => {
              setLoadingRemove(true);
              try {
                await removeState(id).unwrap();
                let cleanupFailed = false;
                for (const row of original?.shipmentStates ||
                  getValues("shipmentStates") ||
                  []) {
                  if (!row.id && !row._id) continue;
                  try {
                    await removeShipmentState(row).unwrap();
                  } catch (error) {
                    if ((error as { status?: number })?.status !== 404)
                      cleanupFailed = true;
                  }
                }
                message(
                  t(
                    cleanupFailed
                      ? "PARTIAL_REMOVE"
                      : "STATE_REMOVED_SUCCESSFULLY",
                  ),
                  cleanupFailed ? "warning" : "success",
                );
                navigate(statesPath(shippingCompanyId, countryId));
              } catch {
                message(t("SOMETHING_WENT_WRONG_WHEN_REMOVE_STATE"), "error");
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
            to={statesPath(shippingCompanyId, countryId)}
            color="inherit"
          >
            <FuseSvgIcon size={20}>
              {theme.direction === "ltr"
                ? "heroicons-outline:arrow-sm-left"
                : "heroicons-outline:arrow-sm-right"}
            </FuseSvgIcon>
            <span className="flex mx-4 font-medium">{t("STATES")}</span>
          </Typography>
        </motion.div>
        <div className="flex items-center max-w-full">
          <motion.div
            className="flex flex-col min-w-0 mx-8 sm:mx-16"
            initial={{ x: -20 }}
            animate={{ x: 0, transition: { delay: 0.3 } }}
          >
            <Typography className="text-16 sm:text-20 truncate font-semibold">
              {t("STATE_DETAILS")}
            </Typography>
            <Typography variant="caption" className="font-medium">
              {displayName(name) || t("ADD_NEW_STATE")}
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
              onClick={handleRemoveState}
              startIcon={<Icon type="fa6" name="FaRegTrashCan" size="0.8em" />}
              loadingPosition="start"
              loading={loadingRemove}
              disabled={busy}
            >
              {t("REMOVE")}
            </LoadingButton>
          </motion.div>
          <motion.div
            className="flex flex-1 w-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
          >
            <Button
              className="whitespace-nowrap mx-4"
              component={Link}
              to={`/cities/${shippingCompanyId}/${id}`}
              variant="outlined"
              disabled={busy}
            >
              {t("VIEW_CITIES")}
            </Button>
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
          onClick={() => handleSaveState()}
          startIcon={<Icon type="fa6" name="FaFloppyDisk" size="0.8em" />}
          loadingPosition="start"
          loading={loading}
          disabled={busy || Boolean(id && !formState.isDirty)}
          data-testid="save-state"
        >
          {t(id ? "SAVE_STATE" : "ADD_STATE")}
        </LoadingButton>
      </motion.div>
    </div>
  );
}

export default StateHeader;
