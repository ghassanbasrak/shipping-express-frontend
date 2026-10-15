import Dialog from "@mui/material/Dialog";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import {
  closeDialog,
  selectFuseDialogProps,
} from "@fuse/core/FuseDialog/fuseDialogSlice";

/**
 * FuseDialog component
 * This component renders a material UI ```Dialog``` component
 * with properties pulled from the redux store
 */
function FuseDialog() {
  const dispatch = useAppDispatch();
  const options = useAppSelector(selectFuseDialogProps);
  return (
    <Dialog
      onClose={
        !(options.options as any).preventDismiss &&
        (() => dispatch(closeDialog()))
      }
      aria-labelledby="fuse-dialog-title"
      sx={{
        "& .MuiModal-backdrop": {
          backgroundColor: `rgba(0, 0, 0, ${(options.options as any).opacity || 0.5})`,
        },
      }}
      classes={{
        paper: options.options?.fullScreen ? "rounded-none" : "rounded-8",
      }}
      {...options}
      {...options.options}
    />
  );
}

export default FuseDialog;
