import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { Box, CircularProgress, TextField, lighten } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { useAppSelector } from "app/store/hooks";
import { ImageFieldInputProps, MediaInputData } from "./Utils";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import ImageCropperDialog from "../image-cropper-dialog/ImageCropperDialog";
import { AppDispatch } from "app/store/store";
import clsx from "clsx";

function ImageFieldInput({
  name,
  label,
  hint,
  className = "mt-8 mb-16",
  containerImageClassName,
  maximumFileSizeInKB,
  imageAspectRatio,
  disableImageCropper = false,
  handleCreateUploadFile,
  pickedData,
  progress,
  finished,
  error,
  setError,
  required = false,
  hideUpload = false,
  size = "medium",
  disabled = false,
  id,
}: ImageFieldInputProps) {
  const { t } = useTranslation("public");
  const user = useAppSelector(selectUser);
  const dispatch = useDispatch<AppDispatch>();
  const methods = useFormContext();
  const { getFieldState, control } = methods;
  return (
    <div className={clsx("w-full flex items-center", containerImageClassName)}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            className={className}
            error={getFieldState(name).invalid || !!error}
            helperText={getFieldState(name)?.error?.message || error}
            label={label}
            placeholder={hint ?? t("TYPE_IMAGE_URL_OR_PICK_AN_IMAGE")}
            id={id || name}
            variant="outlined"
            fullWidth
            required={required}
            size={size === "small" ? "small" : "medium"}
            disabled={disabled}
          />
        )}
      />
      {!hideUpload &&
        (pickedData && !finished ? (
          <CircularProgress
            className="mx-8 mt-8 mb-16"
            color="primary"
            variant={progress ? "determinate" : "indeterminate"}
            value={progress}
            size={28}
          />
        ) : (
          <Box
            sx={{
              backgroundColor: (theme) =>
                theme.palette.mode === "light"
                  ? lighten(theme.palette.background.default, 0.4)
                  : lighten(theme.palette.background.default, 0.02),
            }}
            component="label"
            htmlFor={`${name}-button-file`}
            className="ms-8 logoFileUpload flex flex-col items-center justify-center relative w-40 h-40 rounded-16 overflow-hidden cursor-pointer shadow hover:shadow-lg mt-8 mb-16"
          >
            <input
              accept="image/*"
              className="hidden"
              id={`${id || name}-button-file`}
              type="file"
              onChange={async (e) => {
                function readFileAsync() {
                  return new Promise<MediaInputData>((resolve, reject) => {
                    const file = e.target.files[0];
                    if (!file) {
                      return;
                    }
                    const fileSize = Math.round(file.size / 1024);
                    if (maximumFileSizeInKB && fileSize > maximumFileSizeInKB) {
                      setError(
                        t("IMAGE_SHOULD_BE_SIZEKB", { maximumFileSizeInKB }),
                      );
                      return;
                    }
                    const reader = new FileReader();

                    reader.onload = () => {
                      if (!disableImageCropper) {
                        dispatch(
                          openDialog({
                            maxWidth: "md",
                            fullWidth: true,
                            children: (
                              <ImageCropperDialog
                                title={t("UPLOAD_LABEL_IMAGE", {
                                  label:
                                    label.charAt(0).toUpperCase() +
                                    label.slice(1),
                                })}
                                name={file.name}
                                aspectRatio={imageAspectRatio}
                                // fixedWidth={500}
                                // fixedHeight={500}
                                onCancel={() => (e.target.value = null)}
                                onSubmit={(data) => {
                                  setError(null);
                                  resolve(data);
                                }}
                                imageSrc={`data:${file.type};base64,${btoa(
                                  reader.result as string,
                                )}`}
                              />
                            ),
                          }),
                        );
                      } else {
                        var image = new Image();
                        image.onload = function () {
                          var height = image.height;
                          var width = image.width;
                          if (
                            Boolean(imageAspectRatio) &&
                            height / width === imageAspectRatio
                          ) {
                            setError(t("IMAGE_SHOULD_BE_SQUARE"));
                            return false;
                          }
                          setError(null);
                          resolve({
                            file: file,
                            // name: file.name.split(".").pop(),
                            name: file.name,
                            url: `data:${file.type};base64,${btoa(
                              reader.result as string,
                            )}`,
                          });
                          return true;
                        };
                        image.src = `data:${file.type};base64,${btoa(
                          reader.result as string,
                        )}`;
                      }
                    };
                    reader.onerror = reject;
                    reader.readAsBinaryString(file);
                  });
                }
                const data = await readFileAsync();

                if (data) {
                  handleCreateUploadFile(data);
                }
                e.target.value = null;
              }}
            />
            <FuseSvgIcon>heroicons-outline:upload</FuseSvgIcon>
          </Box>
        ))}
    </div>
  );
}

export default ImageFieldInput;
