import { Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import FuseLoading from "@fuse/core/FuseLoading";
import CustomDialog from "app/shared-components/custom-dialog/CustomDialog";
import { useGetStateQuery, useGetShipmentStatesQuery } from "../StatesApi";
import IState from "../models/IState";
import StateModel from "../models/StateModel";
import { stateSchema } from "../models/StateSchema";
import NamingConfigSection from "../state/sections/NamingConfigSection";
import { displayName } from "../Utils";
export default function ChangeNamingConfigDialog({ state }: { state: IState }) {
  const { t } = useTranslation("statesApp");
  const query = useGetStateQuery(state.id, {
    refetchOnMountOrArgChange: true,
  });
  const mappings = useGetShipmentStatesQuery(state.id, {
    refetchOnMountOrArgChange: true,
  });
  const title = `${t("CHANGE_NAMING_CONFIG_FOR")} "${displayName(state.name)}"`;
  if (!query.currentData || !mappings.currentData)
    return (
      <CustomDialog
        title={title}
        closeIcon
        noActions
        message={
          query.isError || mappings.isError ? (
            <Alert
              severity="error"
              action={
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={() => {
                    query.refetch();
                    mappings.refetch();
                  }}
                >
                  {t("RETRY")}
                </Button>
              }
            >
              {t("SOMETHING_WENT_WRONG")}
            </Alert>
          ) : (
            <FuseLoading />
          )
        }
      />
    );
  return (
    <CustomDialog
      key={`state-names-${state.id}`}
      title={title}
      closeIcon
      noActions
      form
      formSchema={stateSchema(t)}
      formDefaultValues={StateModel({
        ...query.currentData,
        shipmentStates: mappings.currentData.results,
      })}
      message={<NamingConfigSection withoutLocaleNames />}
    />
  );
}
