import { ButtonProps } from "@mui/material";
import { ReactNode } from "react";

export interface AlertDialogProps {
  title?: string;
  message?: ReactNode;
  onSubmit?: () => void; // Assuming no arguments for simplicity
  onCancel?: () => void;
  submitButtonTitle?: string;
  cancelButtonTitle?: string;
  submitButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  customActions?: ReactNode[];
  noActions?: boolean;
  closeIcon?: boolean;
  customCloseAction?: () => void;
}
