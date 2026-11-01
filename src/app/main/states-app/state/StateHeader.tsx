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
    <FeatureHeader>
      <div className="flex items-center justify-between gap-8 min-w-0">
        <Typography
          className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
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
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="states-app">
            {t("STATE_DETAILS")}
          </FeatureHeaderHeading>
          <div className="flex flex-wrap items-center gap-8 mt-8 sm:ps-[72px]">
            <Typography
              color="text.secondary"
              variant="caption"
              className="text-13 leading-relaxed [overflow-wrap:anywhere]"
            >
              {displayName(name) || t("ADD_NEW_STATE")}
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
                onClick={handleRemoveState}
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
                to={`/cities/${shippingCompanyId}/${id}`}
                variant="outlined"
                disabled={busy}
              >
                {t("VIEW_CITIES")}
              </Button>
            </>
          )}
          <LoadingButton
            className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
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
        </FeatureHeaderActions>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}

export default StateHeader;
