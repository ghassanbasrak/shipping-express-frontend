import { LoadingButtonProps } from "@mui/lab";
import { ReactNode } from "react";

export interface CustomDialogProps {
  title?: ReactNode;
  titleBackgroundColor?: string;
  titleClassName?: string;
  message?: string | ReactNode;
  messageBackgroundColor?: "paper" | "default";
  messageClassName?: string;
  onSubmit?: (data?: any) => void; // Assuming data type from form
  onCancel?: () => void;
  hideSubmitButton?: boolean;
  submitButtonTitle?: string;
  hideCancelButton?: boolean;
  cancelButtonTitle?: string;
  submitButtonProps?: LoadingButtonProps;
  submitButtonLoadingTitle?: string;
  submitButtonLoading?: boolean;
  cancelButtonProps?: LoadingButtonProps;
  customActions?: ReactNode[];
  noActions?: boolean;
  closeIcon?: boolean;
  form?: boolean;
  formMode?: "onChange" | "onSubmit" | "onBlur"; // Assuming specific form modes
  formSchema?: any; // Assuming your form schema type
  formDefaultValues?: any; // Assuming your form default values type
  formHotValues?: any; // Assuming your form hot values type (optional)
  formSubmitButtonProps?: LoadingButtonProps;
  formSubmitButtonTitle?: string;
  formCancelButtonProps?: LoadingButtonProps;
  formCancelButtonTitle?: string;
  hideFormCancelButton?: boolean;
  hideFormSubmitButton?: boolean;
  handleSubmitForm?: (data: any) => Promise<string>; // Assuming data type from form (optional)
  disableCloseWhenSubmit?: boolean;
  onClose?: () => void;
  customCloseAction?: () => void;
  successTitle?: boolean;
  errorTitle?: boolean;
}
