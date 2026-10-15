import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { Box, CircularProgress, TextField, lighten } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { useAppSelector } from "app/store/hooks";
import { FileFieldInputProps, MediaInputData } from "./Utils";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import ImageCropperDialog from "../image-cropper-dialog/ImageCropperDialog";
import { AppDispatch } from "app/store/store";
import clsx from "clsx";
import FuseUtils from "@fuse/utils";

function FieldFieldInput({
  name,
  label,
  hint,
  containerClassName,
  className = "mt-8 mb-16 me-8",
  fileUrl,
  maximumFileSizeInKB,
  handleCreateUploadFile,
  pickedData,
  progress,
  finished,
  error,
  setError,
  required = false,
  hideUpload = false,
  disabled = false,
  size,
}: FileFieldInputProps) {
  const { t } = useTranslation("public");
  const user = useAppSelector(selectUser);
  const dispatch = useDispatch<AppDispatch>();
  const methods = useFormContext();
  const { getFieldState, control } = methods;

  const inputId = `${name}-${FuseUtils.generateGUID()}-button-file`;

  return (
    <div className={clsx("w-full flex items-center", containerClassName)}>
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
            placeholder={hint ?? t("TYPE_FILE_URL_OR_PICK_AN_FILE")}
            id={name}
            variant="outlined"
            fullWidth
            required={required}
            disabled={disabled}
            size={size === "small" ? "small" : "medium"}
          />
        )}
      />
      {!hideUpload &&
        (pickedData && !finished ? (
          <CircularProgress
            className="me-8 mt-8 mb-16"
            color="primary"
            variant={progress ? "determinate" : "indeterminate"}
            value={progress}
            size={30}
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
            htmlFor={inputId}
            className="logoFileUpload flex flex-col items-center justify-center relative w-40 h-40 rounded-16 overflow-hidden cursor-pointer shadow hover:shadow-lg mt-8 mb-16"
          >
            <input
              // accept="image/*"
              className="hidden"
              id={inputId}
              type="file"
              onChange={async (e) => {
                function readFileAsync() {
                  return new Promise<MediaInputData>((resolve, reject) => {
                    const file = e.target.files[0];
                    if (!file) {
                      return;
                    }
                    const reader = new FileReader();

                    reader.onload = (event) => {
                      resolve({
                        file: e.target.files[0],
                        // name: e.target.files[0].name.split(".").pop(),
                        name: e.target.files[0].name,
                        url: `data:${file.type};base64,${btoa(
                          reader.result as string
                        )}`,
                      });
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

export default FieldFieldInput;
