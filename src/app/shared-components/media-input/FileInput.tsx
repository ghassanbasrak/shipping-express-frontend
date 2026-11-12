import { useEffect, useId } from "react";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import {
  Box,
  IconButton,
  LinearProgress,
  Typography,
  lighten,
} from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { FileFieldInputProps } from "./Utils";

type FileInputProps = FileFieldInputProps & {
  accept?: string;
  onBusy?: (busy: boolean) => void;
  onReset?: () => void;
};

/** FileFieldInput's file selection with ImageInput's upload-box presentation. */
export default function FileInput({
  name,
  label,
  hint,
  className = "mb-16",
  maximumFileSizeInKB,
  accept,
  pickedData,
  progress,
  finished,
  error,
  setError,
  handleCreateUploadFile,
  handleResetFile,
  disabled = false,
  size = "medium",
  containerImageClassName,
  onReset,
  onBusy,
}: FileInputProps) {
  const { t } = useTranslation("public");
  const { control, getFieldState } = useFormContext();
  const value = useWatch({ control, name });
  const inputId = useId();
  const uploading = !!pickedData && !finished;
  const validationError = getFieldState(name).error?.message;
  useEffect(() => {
    onBusy?.(uploading);
  }, [uploading, onBusy]);
  const dimensions =
    size === "grid-fit"
      ? "w-full h-full min-h-200"
      : size === "small"
        ? "w-120 h-120"
        : size === "big"
          ? "w-320 h-320"
          : "w-200 h-200";
  return (
    <div className={className}>
      <Box
        className={clsx(
          "relative flex flex-col items-center justify-center rounded-16 shadow overflow-hidden max-w-full",
          dimensions,
          containerImageClassName,
        )}
        sx={{
          backgroundColor: (theme) =>
            lighten(
              theme.palette.background.default,
              theme.palette.mode === "light" ? 0.4 : 0.02,
            ),
        }}
      >
        {value && !uploading ? (
          <>
            <IconButton
              className="absolute top-0 right-0"
              aria-label={t("CANCEL") + ": " + label}
              disabled={disabled}
              color="error"
              onClick={() => {
                handleResetFile();
                onReset?.();
              }}
            >
              <FuseSvgIcon>material-solid:close</FuseSvgIcon>
            </IconButton>
            <FuseSvgIcon size={48} color="action">
              heroicons-outline:document-text
            </FuseSvgIcon>
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="max-w-full break-all p-12 text-center"
            >
              {pickedData?.name || label}
            </a>
          </>
        ) : (
          <Box
            component="label"
            htmlFor={inputId}
            className={clsx(
              "flex flex-col items-center justify-center gap-12 p-16 w-full h-full text-center",
              !disabled && !uploading && "cursor-pointer",
            )}
          >
            <input
              id={inputId}
              type="file"
              aria-label={label}
              hidden
              accept={accept}
              disabled={disabled || uploading}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (
                  maximumFileSizeInKB &&
                  file.size > maximumFileSizeInKB * 1024
                ) {
                  setError(
                    t("IMAGE_SHOULD_BE_SIZEKB", { maximumFileSizeInKB }),
                  );
                  return;
                }
                try {
                  const url = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result));
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                  });
                  setError(null);
                  handleCreateUploadFile({ file, name: file.name, url });
                } catch {
                  setError(t("ERROR_READING_FILE"));
                }
              }}
            />
            <FuseSvgIcon size={size === "small" ? 40 : 60} color="action">
              heroicons-outline:upload
            </FuseSvgIcon>
            <Typography>{t("UPLOAD_LABEL_FILE", { label })}</Typography>
            {uploading && (
              <LinearProgress
                className="w-full"
                variant={progress ? "determinate" : "indeterminate"}
                value={progress || 0}
              />
            )}
          </Box>
        )}
      </Box>
      {(validationError || error || hint) && (
        <Typography
          className="text-13 mt-8"
          color={validationError || error ? "error" : "text.secondary"}
        >
          {validationError || error || hint}
        </Typography>
      )}
    </div>
  );
}
