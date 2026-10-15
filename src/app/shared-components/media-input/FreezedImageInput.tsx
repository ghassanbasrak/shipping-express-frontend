import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import {
  Box,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
  lighten,
  styled,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { FreezedImageInputProps, MediaInputData } from "./Utils";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import ImageCropperDialog from "../image-cropper-dialog/ImageCropperDialog";
import { AppDispatch } from "app/store/store";
import { Dispatch } from "@reduxjs/toolkit";
import clsx from "clsx";

const Root = styled("div")(({ theme }) => ({
  "& .imageFileRemove": {
    position: "absolute",
    top: 0,
    right: 0,
    color: "red",
    zIndex: 11,
  },
  "& .imageFileImage": {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },

  "& .imageFileUpload": {
    transitionProperty: "box-shadow",
    transitionDuration: theme.transitions.duration.short,
    transitionTimingFunction: theme.transitions.easing.easeInOut,
  },

  "& .imageFileItem": {
    position: "absolute",
    transitionProperty: "box-shadow",
    transitionDuration: theme.transitions.duration.short,
    transitionTimingFunction: theme.transitions.easing.easeInOut,
    "&.featured": {
      pointerEvents: "none",
      boxShadow: theme.shadows[3],
      "& .imageFileRemove": {
        opacity: 1,
      },
      "&:hover .imageFileRemove": {
        opacity: 1,
      },
    },
  },
}));

function FreezedImageInput({
  label,
  value,
  onChange,
  handleCreateUploadFile,
  hint,
  imageUrl,
  className = "mb-16",
  maximumFileSizeInKB,
  imageAspectRatio,
  disableImageCropper = false,
  pickedData,
  progress,
  finished,
  error,
  setError,
  handleResetFile,
  size = "medium",
  containerImageClassName,
  onReset,
  tooltipTitle,
  multiple = false,
  onSelectMultiple,
  disabled = false,
  validationError,
  circle = false,
}: FreezedImageInputProps) {
  const { t } = useTranslation("public");
  const dispatch = useDispatch<AppDispatch>();
  return (
    <div className={className}>
      {validationError ? (
        <Typography color="error" className="text-14 my-8" textAlign="center">
          {validationError}
        </Typography>
      ) : null}
      <Root>
        <div className="flex items-center justify-center flex-wrap">
          <div className="flex relative w-full items-center justify-center">
            {(!!pickedData || !!imageUrl) && (
              <Tooltip title={tooltipTitle ?? label}>
                <Box
                  sx={{
                    backgroundColor: (theme) =>
                      theme.palette.mode === "light"
                        ? lighten(theme.palette.background.default, 0.4)
                        : lighten(theme.palette.background.default, 0.02),
                  }}
                  component="label"
                  className={clsx(
                    "imageFileItem flex flex-col items-center justify-center relative overflow-hidden shadow hover:shadow-lg",
                    circle ? "rounded-full" : "rounded-16",
                    size === "grid-fit"
                      ? "w-full h-full"
                      : size === "small"
                        ? "w-120 h-120"
                        : size === "medium"
                          ? "w-200 h-200"
                          : "w-320 h-320",
                    containerImageClassName
                  )}
                >
                  {(finished || (!!imageUrl && value && !pickedData)) && (
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();
                        handleResetFile();
                        if (onReset) {
                          onReset();
                        }
                      }}
                      className="imageFileRemove"
                      disabled={disabled}
                      sx={
                        circle
                          ? { top: "10px !important", right: "10px !important" }
                          : undefined
                      }
                    >
                      <FuseSvgIcon
                        size={
                          size === "grid-fit" || size === "small"
                            ? 18
                            : size === "medium"
                              ? 24
                              : 30
                        }
                      >
                        material-solid:close
                      </FuseSvgIcon>
                    </IconButton>
                  )}

                  {!finished && pickedData && (
                    <div
                      className="flex flex-col items-center justify-center w-full h-full p-16"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 11,
                      }}
                    >
                      {finished ? (
                        <Typography
                          className={clsx(
                            "flex items-center space-x-6 font-semibold",
                            size === "grid-fit" || size === "small"
                              ? "text-12"
                              : size === "medium"
                                ? "text-13"
                                : "text-15"
                          )}
                          sx={{
                            color: (theme) => theme.palette.success.main,
                          }}
                        >
                          <FuseSvgIcon color="inherit" size={22}>
                            material-solid:check
                          </FuseSvgIcon>
                          <span className="whitespace-nowrap m-l-8 leading-none">
                            {t("UPLOADED")}
                          </span>
                        </Typography>
                      ) : (
                        <LinearProgress
                          className="w-full mx-8 px-8"
                          color="primary"
                          variant={progress ? "determinate" : "indeterminate"}
                          value={progress}
                        />
                      )}
                    </div>
                  )}
                  {(pickedData || (!!imageUrl && value)) && (
                    <img
                      className="max-w-full object-contain w-full max-h-full h-full imageFileImage"
                      src={
                        pickedData ? pickedData.url : !!imageUrl ? value : ""
                      }
                      alt="image"
                      style={{ zIndex: 10, backgroundColor: "white" }}
                    />
                  )}
                </Box>
              </Tooltip>
            )}
            <Box
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === "light"
                    ? lighten(theme.palette.background.default, 0.4)
                    : lighten(theme.palette.background.default, 0.02),
                zIndex: 1,
              }}
              component="label"
              htmlFor={`${label}-button-file`}
              className={clsx(
                "imageFileUpload flex flex-col items-center justify-center relative overflow-hidden cursor-pointer shadow hover:shadow-lg",
                circle ? "rounded-full" : "rounded-16",
                size === "grid-fit"
                  ? "w-full h-full"
                  : size === "small"
                    ? "w-120 h-120"
                    : size === "medium"
                      ? "w-200 h-200"
                      : "w-320 h-320",
                containerImageClassName
              )}
            >
              <input
                accept="image/*"
                className="hidden"
                id={`${label}-button-file`}
                type="file"
                multiple={multiple}
                disabled={disabled}
                onChange={async (e) => {
                  function readFilesAsync() {
                    return new Promise<MediaInputData[]>((resolve, reject) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) {
                        return;
                      }
                      var filteredFiles = [...files].filter((file) => {
                        const fileSize = Math.round(file.size / 1024);
                        return !(
                          maximumFileSizeInKB && fileSize > maximumFileSizeInKB
                        );
                      });
                      if (filteredFiles.length === 1) {
                        reject({ error: "single", file: filteredFiles[0] });
                        return;
                      }
                      const errors: string[] = [];
                      const dataItems: MediaInputData[] = [];
                      for (let i = 0; i < filteredFiles.length; i++) {
                        const file = filteredFiles[i];
                        const reader = new FileReader();
                        reader.onload = () => {
                          var image = new Image();
                          image.onload = function () {
                            var height = image.height;
                            var width = image.width;
                            if (
                              Boolean(imageAspectRatio) &&
                              height / width === imageAspectRatio
                            ) {
                              errors.push(t("IMAGE_SHOULD_BE_SQUARE"));
                              // return false;
                              return true;
                            }
                            dataItems.push({
                              file,
                              name: file.name,
                              url: `data:${file.type};base64,${btoa(
                                reader.result as string
                              )}`,
                            });
                            if (
                              dataItems.length + errors.length ===
                              filteredFiles.length
                            ) {
                              resolve(dataItems);
                            }
                            return true;
                          };
                          image.src = `data:${file.type};base64,${btoa(
                            reader.result as string
                          )}`;
                        };
                        reader.onerror = () => {
                          errors.push(t("ERROR_READING_FILE"));
                        };
                        reader.readAsBinaryString(file);
                      }
                    });
                  }
                  function readFileAsync(initialFile?: File) {
                    return new Promise<MediaInputData>((resolve, reject) => {
                      const file = initialFile ?? e.target.files[0];
                      if (!file) {
                        return;
                      }
                      const fileSize = Math.round(file.size / 1024);
                      if (
                        maximumFileSizeInKB &&
                        fileSize > maximumFileSizeInKB
                      ) {
                        setError(
                          t("IMAGE_SHOULD_BE_SIZEKB", { maximumFileSizeInKB })
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
                                    reader.result as string
                                  )}`}
                                />
                              ),
                            })
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
                                reader.result as string
                              )}`,
                            });
                            return true;
                          };
                          image.src = `data:${file.type};base64,${btoa(
                            reader.result as string
                          )}`;
                        }
                      };
                      reader.onerror = reject;
                      reader.readAsBinaryString(file);
                    });
                  }
                  if (multiple) {
                    try {
                      const dataItems = await readFilesAsync();
                      onSelectMultiple(dataItems);
                    } catch (e) {
                      if (
                        typeof e === "object" &&
                        e?.error === "single" &&
                        e?.file
                      ) {
                        const data = await readFileAsync(e.file);
                        if (data) {
                          handleCreateUploadFile(data);
                        }
                      }
                    }
                  } else {
                    const data = await readFileAsync();
                    if (data) {
                      handleCreateUploadFile(data);
                    }
                  }
                  e.target.value = null;
                }}
              />
              <FuseSvgIcon
                size={
                  size === "grid-fit" || size === "small"
                    ? 30
                    : size === "medium"
                      ? 50
                      : 60
                }
                color="action"
              >
                heroicons-outline:upload
              </FuseSvgIcon>
              <Typography
                color="action"
                className={clsx(
                  "my-16",
                  size === "grid-fit" || size === "small"
                    ? "text-13"
                    : size === "medium"
                      ? "text-15"
                      : "text-17"
                )}
              >
                {t("UPLOAD_LABEL_IMAGE", {
                  label: label.charAt(0).toUpperCase() + label.slice(1),
                })}
              </Typography>
              {(error || hint) && (
                <Typography
                  color={error ? "error" : "text.disabled"}
                  className={clsx(
                    "my-8 mx-16",
                    size === "grid-fit" || size === "small"
                      ? "text-10"
                      : size === "medium"
                        ? "text-12"
                        : "text-13"
                  )}
                  textAlign="center"
                >
                  {error ?? hint}
                </Typography>
              )}
            </Box>
          </div>
        </div>
      </Root>
    </div>
  );
}

export default FreezedImageInput;
