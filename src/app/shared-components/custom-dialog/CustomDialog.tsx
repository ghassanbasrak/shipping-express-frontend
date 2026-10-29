import { Fragment, useEffect, useState } from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { closeDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { CustomDialogProps } from "./Utils";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import _ from "lodash";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";

function CustomDialog({
  title,
  titleBackgroundColor,
  titleClassName = "flex items-center justify-between font-medium",
  message,
  messageClassName,
  messageBackgroundColor = "paper",
  onSubmit,
  onCancel,
  hideSubmitButton = false,
  hideCancelButton = false,
  submitButtonTitle,
  cancelButtonTitle,
  submitButtonProps = {},
  submitButtonLoadingTitle,
  submitButtonLoading = false,
  cancelButtonProps = {},
  customActions = [],
  noActions,
  closeIcon,
  form,
  formMode = "onChange",
  formSchema,
  formDefaultValues = {},
  formHotValues,
  formSubmitButtonProps = {},
  formSubmitButtonTitle,
  formCancelButtonProps = {},
  formCancelButtonTitle,
  hideFormCancelButton = false,
  hideFormSubmitButton = false,
  handleSubmitForm,
  disableCloseWhenSubmit = false,
  onClose,
  successTitle,
  errorTitle,
  customCloseAction,
}: CustomDialogProps) {
  const { t } = useTranslation("public");
  const dispatch = useDispatch();
  const methods = useForm({
    mode: formMode,
    defaultValues: formDefaultValues,
    resolver: form && zodResolver(formSchema),
  });
  const {
    control,
    handleSubmit,
    formState: { isValid, dirtyFields, errors },
    reset,
    getValues,
  } = methods;

  const [loading, setLoading] = useState(false);

  function submitForm() {
    const onSubmit = async (data) => {
      setLoading(true);
      try {
        const message = await handleSubmitForm(data);
        if (message) {
          dispatch(
            showMessage({
              message,
              autoHideDuration: 2000,
              variant: "success",
              anchorOrigin: { vertical: "top", horizontal: "right" },
            }),
          );
        }

        if (!disableCloseWhenSubmit) {
          customCloseAction ? customCloseAction() : dispatch(closeDialog());
        }
        onClose?.();
      } catch (error) {
        dispatch(
          showMessage({
            message: error,
            autoHideDuration: 2000,
            variant: "error",
            anchorOrigin: { vertical: "top", horizontal: "right" },
          }),
        );
      } finally {
        setLoading(false);
      }
    };
    handleSubmit(onSubmit)();
  }

  useEffect(() => {
    if (formHotValues) {
      reset({ ...getValues(), ...formHotValues });
    }
  }, [formHotValues]);

  const submitFormButtonProps: LoadingButtonProps = {
    className: "px-8 whitespace-nowrap",
    variant: "contained",
    color: "secondary",
    size: "small",
    onClick: submitForm,
    loading: loading,
    loadingPosition: "start",
    startIcon: <FuseSvgIcon size={18}>material-twotone:add</FuseSvgIcon>,

    disabled:
      formMode === "onChange" &&
      ((_.isEmpty(dirtyFields) && _.isEqual(dirtyFields, formDefaultValues)) ||
        !isValid),
    ...formSubmitButtonProps,
  };
  console.log(getValues(), "getValues");
  console.log(errors, "errors");
  return (
    <Fragment>
      <FormProvider {...methods}>
        <DialogTitle
          className={titleClassName}
          sx={{
            bgcolor: titleBackgroundColor
              ? (theme) => theme.palette[titleBackgroundColor].main
              : successTitle
                ? (theme) => theme.palette.success.main
                : errorTitle
                  ? (theme) => theme.palette.error.main
                  : undefined,
            color:
              titleBackgroundColor || successTitle || errorTitle
                ? "white"
                : undefined,
          }}
        >
          <div className="flex items-center space-x-8">
            {(successTitle || errorTitle) && (
              <FuseSvgIcon size={26}>
                {successTitle
                  ? "heroicons-outline:check-circle"
                  : "heroicons-outline:exclamation-circle"}
              </FuseSvgIcon>
            )}
            <span>{title}</span>
          </div>

          {closeIcon && (
            <IconButton
              edge="end"
              color="primary"
              onClick={() => {
                customCloseAction
                  ? customCloseAction()
                  : dispatch(closeDialog());
                if (onClose) {
                  onClose();
                }
              }}
              aria-label="close"
            >
              <FuseSvgIcon className="sm:flex">
                material-twotone:close
              </FuseSvgIcon>
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent
          className={messageClassName ?? "flex flex-col"}
          sx={{
            bgcolor: (theme) =>
              theme.palette.background[messageBackgroundColor],
          }}
        >
          {message}
        </DialogContent>
        {!noActions && (
          <DialogActions>
            {form ? (
              <div className="flex items-center space-x-8">
                {!hideFormCancelButton && (
                  <Button
                    className="px-4 whitespace-nowrap"
                    size="small"
                    color="primary"
                    variant="outlined"
                    {...formCancelButtonProps}
                    onClick={() => {
                      customCloseAction
                        ? customCloseAction()
                        : dispatch(closeDialog());
                      if (onCancel) {
                        onCancel();
                      }
                    }}
                  >
                    {formCancelButtonTitle ?? t("CANCEL")}
                  </Button>
                )}
                {!hideFormSubmitButton && (
                  <LoadingButton
                    color="secondary"
                    variant="contained"
                    {...submitFormButtonProps}
                  >
                    <span>{formSubmitButtonTitle ?? t("ADD")}</span>
                  </LoadingButton>
                )}
              </div>
            ) : customActions.length > 0 ? (
              customActions
            ) : (
              <>
                {!hideFormCancelButton && (
                  <Button
                    size="small"
                    color="primary"
                    variant="outlined"
                    {...cancelButtonProps}
                    onClick={() => {
                      customCloseAction
                        ? customCloseAction()
                        : dispatch(closeDialog());
                      if (onClose) {
                        onClose();
                      }
                      if (onCancel) {
                        onCancel();
                      }
                    }}
                  >
                    {cancelButtonTitle ?? t("NO")}
                  </Button>
                )}
                {!hideSubmitButton && (
                  <LoadingButton
                    size="small"
                    color="error"
                    variant="contained"
                    {...submitButtonProps}
                    onClick={() => {
                      if (!disableCloseWhenSubmit) {
                        customCloseAction
                          ? customCloseAction()
                          : dispatch(closeDialog());
                        if (onClose) {
                          onClose();
                        }
                      }
                      if (onSubmit) {
                        onSubmit();
                      }
                    }}
                    loading={submitButtonLoading}
                    loadingIndicator={submitButtonLoadingTitle ?? t("LOADING")}
                  >
                    <span>{submitButtonTitle ?? t("YES")}</span>
                  </LoadingButton>
                )}
              </>
            )}
          </DialogActions>
        )}
      </FormProvider>
    </Fragment>
  );
}

export default CustomDialog;
