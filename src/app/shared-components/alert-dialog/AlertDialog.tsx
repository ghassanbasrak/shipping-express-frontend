import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon"; // Assuming the component is available
import { closeDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { AlertDialogProps } from "./Utils";

function AlertDialog({
  title = "",
  message = "",
  onSubmit = null,
  onCancel = null,
  submitButtonTitle = null,
  cancelButtonTitle = null,
  submitButtonProps = { color: "error" },
  cancelButtonProps = {},
  customActions = [],
  noActions = false,
  closeIcon = false,
  customCloseAction,
}: AlertDialogProps) {
  const { t } = useTranslation("public");
  const dispatch = useDispatch();

  const handleClose = () => {
    customCloseAction ? customCloseAction() : dispatch(closeDialog());
  };

  const handleCancel = () => {
    handleClose();
    onCancel?.();
  };

  const handleSubmit = () => {
    handleClose();
    onSubmit?.();
  };

  return (
    <>
      <DialogTitle className="flex items-center justify-between">
        <span>{title}</span>
        {closeIcon && (
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <FuseSvgIcon className="sm:flex">
              material-twotone:close
            </FuseSvgIcon>
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent className="flex flex-col">{message}</DialogContent>
      {!noActions && (
        <DialogActions>
          {customActions.length > 0 ? (
            customActions
          ) : (
            <>
              <Button {...cancelButtonProps} onClick={handleCancel}>
                {cancelButtonTitle ?? t("NO")}
              </Button>
              <Button {...submitButtonProps} onClick={handleSubmit}>
                {submitButtonTitle ?? t("YES")}
              </Button>
            </>
          )}
        </DialogActions>
      )}
    </>
  );
}

export default AlertDialog;
