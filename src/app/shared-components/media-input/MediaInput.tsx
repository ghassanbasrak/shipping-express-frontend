import { useTranslation } from "react-i18next";
import FileFieldInput from "./FileFieldInput";
import ImageFieldInput from "./ImageFieldInput";
import ImageInput from "./ImageInput";
import { MediaInputData, MediaInputProps, MediaInputTypes } from "./Utils";
import { useDispatch } from "react-redux";
import { AppDispatch } from "app/store/store";
import { createMedia, uploadMedia } from "./store/mediaSlice";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useFormContext } from "react-hook-form";
import { useEffect, useState } from "react";

function MediaInput(props: MediaInputProps) {
  const {
    name,
    type = MediaInputTypes.image,
    label,
    initialData,
    onUploadError,
    onUploadDone,
    preventSetValue = false,
  } = props;
  const dispatch = useDispatch<AppDispatch>();
  const user = useAppSelector(selectUser);
  const { t } = useTranslation("public");
  const methods = useFormContext();
  const [pickedData, setPickedData] = useState<MediaInputData>(null);
  const [progress, setProgress] = useState(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState(null);
  const { setValue, getFieldState, getValues } = methods;
  function handleResetFile() {
    setPickedData(null);
    setProgress(null);
    setFinished(false);
    setError(null);
    if (!preventSetValue) {
      setValue(name, undefined, { shouldDirty: true });
    }
  }
  function handleCreateFile(data: MediaInputData) {
    setPickedData(data);
    setProgress(null);
    setFinished(false);
    dispatch(
      createMedia({
        userId: user.id,
        fileName: data.name,
      })
    ).then((action: any) => {
      if (!action.payload && action.error) {
        const message = t("SOMETHING_WENT_WRONG_WHEN_CREATE_LABEL_IMAGE", {
          label: label.charAt(0).toLowerCase() + label.slice(1),
        });
        dispatch(
          showMessage({
            message,
            autoHideDuration: 2000,
            variant: "error",
            anchorOrigin: {
              vertical: "top",
              horizontal: "right",
            },
          })
        );
        handleResetFile();
        if (onUploadError) {
          onUploadError(message);
        }
        return;
      }

      const awsData = action.payload;
      dispatch(
        uploadMedia({
          ...awsData,
          file: data.file,
          onUploadProgress,
        })
      ).then((awsAction: any) => {
        if (!awsAction.payload && awsAction.error) {
          const message = t("SOMETHING_WENT_WRONG_WHEN_UPLOAD_LABEL_IMAGE", {
            label: label.charAt(0).toLowerCase() + label.slice(1),
          });
          dispatch(
            showMessage({
              message,
              autoHideDuration: 2000,
              variant: "error",
              anchorOrigin: {
                vertical: "top",
                horizontal: "right",
              },
            })
          );
          handleResetFile();
          if (onUploadError) {
            onUploadError(message);
          }
          return;
        }

        setFinished(true);
        if (!preventSetValue) {
          setValue(name, awsData.url + awsData.fields.key);
        }
        if (onUploadDone) {
          onUploadDone(awsData.url + awsData.fields.key);
        }
      });
    });
  }
  const onUploadProgress = (progressEvent) => {
    if (progressEvent && progressEvent.total) {
      setProgress(
        Math.round((progressEvent.loaded * 100) / progressEvent.total)
      );
    }
  };

  useEffect(() => {
    if (initialData) {
      handleResetFile();
      handleCreateFile(initialData);
    }
  }, [initialData]);

  function getInputElement(type: MediaInputTypes): React.ComponentType<any> {
    switch (type) {
      case MediaInputTypes.image:
        return ImageInput;
      case MediaInputTypes.imageField:
        return ImageFieldInput;
      case MediaInputTypes.fileField:
        return FileFieldInput;
      default:
        return ImageInput;
    }
  }

  const Input = getInputElement(type);
  return (
    <Input
      {...props}
      pickedData={pickedData}
      progress={progress}
      finished={finished}
      error={error}
      setError={setError}
      handleCreateUploadFile={handleCreateFile}
      handleResetFile={handleResetFile}
    />
  );
}

export default MediaInput;
