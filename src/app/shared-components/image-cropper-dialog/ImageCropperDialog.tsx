import { useRef, useState } from "react";
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
import { Cropper, ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { LoadingButton } from "@mui/lab";
import { closeDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { ImageCropperDialogProps } from "./Utils";

function ImageCropperDialog({
  title = "",
  onSubmit,
  onCancel,
  submitButtonTitle,
  cancelButtonTitle,
  submitButtonProps = { variant: "contained", size: "small", color: "success" },
  cancelButtonProps = { variant: "contained", size: "small", color: "primary" },
  imageSrc,
  aspectRatio,
  fixedWidth,
  fixedHeight,
  maxWidth,
  maxHeight,
  minWidth = 100,
  minHeight = 100,
  cropperProps = {},
  name,
}: ImageCropperDialogProps) {
  const { t } = useTranslation("public");
  const dispatch = useDispatch();
  const [loadingUpload, setLoadingUpload] = useState(false);
  const cropperRef = useRef<ReactCropperElement | null>(null);

  const getCropData = () => {
    if (cropperRef.current?.cropper) {
      const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas({
        width: fixedWidth,
        height: fixedHeight,
      });
      croppedCanvas.toBlob((blob) => {
        setLoadingUpload(false);
        dispatch(closeDialog());
        if (onSubmit) {
          onSubmit({
            name,
            file: new File([blob], title),
            url: croppedCanvas.toDataURL(),
          });
        }
      });
    }
  };

  return (
    <>
      <DialogTitle className="flex items-center justify-between">
        <span>{title}</span>
        <IconButton
          edge="end"
          color="inherit"
          onClick={() => dispatch(closeDialog())}
          aria-label="close"
        >
          <FuseSvgIcon className="sm:flex">material-twotone:close</FuseSvgIcon>
        </IconButton>
      </DialogTitle>
      <DialogContent className="flex flex-col">
        <Cropper
          ref={cropperRef}
          style={{ minHeight: 400, width: "100%" }}
          initialAspectRatio={aspectRatio}
          src={imageSrc}
          viewMode={1}
          minCropBoxHeight={minHeight}
          minCropBoxWidth={minWidth}
          background={false}
          responsive={true}
          autoCropArea={1}
          aspectRatio={aspectRatio}
          checkOrientation={false}
          guides={true}
          {...cropperProps}
        />
      </DialogContent>
      <DialogActions>
        <Button
          {...cancelButtonProps}
          onClick={() => {
            dispatch(closeDialog());
            onCancel?.();
          }}
        >
          {cancelButtonTitle ?? t("CANCEL")}
        </Button>
        <LoadingButton
          {...submitButtonProps}
          onClick={() => {
            setLoadingUpload(true);
            getCropData();
          }}
          loading={loadingUpload}
          loadingPosition="start"
          startIcon={
            <FuseSvgIcon size={17}>heroicons-outline:upload</FuseSvgIcon>
          }
        >
          {submitButtonTitle ?? t("UPLOAD")}
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export default ImageCropperDialog;
