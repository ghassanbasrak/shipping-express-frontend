import { useTranslation } from "react-i18next";
import FreezedImageInput from "./FreezedImageInput";
import {
  MediaInputData,
  FreezedMediaInputProps,
  FreezedMediaInputTypes,
} from "./Utils";
import { useDispatch } from "react-redux";
import { AppDispatch } from "app/store/store";
import { createMedia, uploadMedia } from "./store/mediaSlice";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useEffect, useState } from "react";

function FreezedMediaInput(props: FreezedMediaInputProps) {
  const {
    value,
    onChange,
    type = FreezedMediaInputTypes.image,
    label,
    initialData,
    onUploadError,
    onUploadDone,
    preventSetValue = false,
  } = props;
  const dispatch = useDispatch<AppDispatch>();
  const user = useAppSelector(selectUser);
  const { t } = useTranslation("public");
  const [pickedData, setPickedData] = useState<MediaInputData>(null);
  const [progress, setProgress] = useState(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState(null);
  function handleResetFile() {
    setPickedData(null);
    setProgress(null);
    setFinished(false);
    setError(null);
    if (!preventSetValue) {
      onChange(undefined);
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
          onChange(awsData.url + awsData.fields.key);
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

  function getInputElement(
    type: FreezedMediaInputTypes
  ): React.ComponentType<any> {
    switch (type) {
      case FreezedMediaInputTypes.image:
        return FreezedImageInput;
      //   case FreezedMediaInputTypes.imageField:
      //     return ImageFieldInput;
      //   case FreezedMediaInputTypes.fileField:
      //     return FileFieldInput;
      default:
        return FreezedImageInput;
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

export default FreezedMediaInput;
