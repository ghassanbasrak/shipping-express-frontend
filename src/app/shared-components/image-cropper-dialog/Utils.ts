import { LoadingButtonProps } from "@mui/lab";
import { ButtonProps } from "@mui/material";
import { ReactCropperProps } from "react-cropper";

export interface ImageCropperDialogProps {
  title?: string;
  onSubmit?: (data: { name: string; file: File; url: string }) => void;
  onCancel?: () => void;
  submitButtonTitle?: string;
  cancelButtonTitle?: string;
  submitButtonProps?: LoadingButtonProps; // Extended for LoadingButton
  cancelButtonProps?: ButtonProps;
  imageSrc?: string;
  aspectRatio?: number;
  fixedWidth?: number;
  fixedHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  cropperProps?: ReactCropperProps; // Assuming props for react-cropper
  name?: string;
}
