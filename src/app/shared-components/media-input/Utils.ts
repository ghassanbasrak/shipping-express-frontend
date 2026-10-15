import { Dispatch } from "@reduxjs/toolkit";

export enum MediaInputTypes {
  image = "image",
  imageField = "imageField",
  fileField = "fileField",
}
export enum FreezedMediaInputTypes {
  image = "image",
}

export interface MediaInputData {
  file: File;
  name: string;
  url: string;
}

export interface ImageInputProps {
  name: string;
  label: string;
  handleCreateUploadFile: (data: MediaInputData) => void;
  hint?: string;
  imageUrl?: string;
  className?: string;
  maximumFileSizeInKB?: number;
  imageAspectRatio?: number;
  disableImageCropper?: boolean;
  pickedData?: MediaInputData;
  progress?: number;
  finished?: boolean;
  error?: string;
  setError?: Dispatch<any>;
  handleResetFile: () => void;
  size?: "small" | "medium" | "big" | "grid-fit";
  containerImageClassName?: string;
  onReset?: () => void;
  tooltipTitle?: string;
  multiple?: boolean;
  onSelectMultiple?: (datas: MediaInputData[]) => void;
  disabled?: boolean;
  circle?: boolean;
  dark?: boolean;
  id?: string;
}
export interface FreezedImageInputProps {
  label: string;
  onChange: (url: string) => void;
  value: string;
  handleCreateUploadFile: (data: MediaInputData) => void;
  hint?: string;
  imageUrl?: string;
  className?: string;
  maximumFileSizeInKB?: number;
  imageAspectRatio?: number;
  disableImageCropper?: boolean;
  pickedData?: MediaInputData;
  progress?: number;
  finished?: boolean;
  error?: string;
  setError?: Dispatch<any>;
  validationError?: string;
  handleResetFile: () => void;
  size?: "small" | "medium" | "big" | "grid-fit";
  containerImageClassName?: string;
  onReset?: () => void;
  tooltipTitle?: string;
  multiple?: boolean;
  onSelectMultiple?: (datas: MediaInputData[]) => void;
  disabled?: boolean;
  circle?: boolean;
}

export interface ImageFieldInputProps {
  name: string;
  label: string;
  handleCreateUploadFile: (data: MediaInputData) => void;
  hint?: string;
  imageUrl?: string;
  className?: string;
  maximumFileSizeInKB?: number;
  imageAspectRatio?: number;
  disableImageCropper?: boolean;
  pickedData?: MediaInputData;
  progress?: number;
  finished?: boolean;
  error?: string;
  setError?: Dispatch<any>;
  handleResetFile: () => void;
  required?: boolean;
  hideUpload?: boolean;
  containerImageClassName?: string;
  size?: "small" | "medium" | "big" | "grid-fit";
  disabled?: boolean;
  id?: string;
}
export interface FileFieldInputProps {
  name: string;
  label: string;
  handleCreateUploadFile: (data: MediaInputData) => void;
  hint?: string;
  fileUrl?: string;
  containerClassName?: string;
  className?: string;
  maximumFileSizeInKB?: number;
  pickedData?: MediaInputData;
  progress?: number;
  finished?: boolean;
  error?: string;
  setError?: Dispatch<any>;
  handleResetFile: () => void;
  required?: boolean;
  hideUpload?: boolean;
  containerImageClassName?: string;
  size?: "small" | "medium" | "big" | "grid-fit";
  disabled?: boolean;
  id?: string;
}

export interface MediaInputProps {
  type?: MediaInputTypes;
  name: string;
  label: string;
  hint?: string;
  imageUrl?: string;
  className?: string;
  maximumFileSizeInKB?: number;
  imageAspectRatio?: number;
  disableImageCropper?: boolean;
  required?: boolean;
  hideUpload?: boolean;
  size?: "small" | "medium" | "big" | "grid-fit";
  containerImageClassName?: string;
  onReset?: () => void;
  tooltipTitle?: string;
  initialData?: MediaInputData;
  multiple?: boolean;
  onSelectMultiple?: (datas: MediaInputData[]) => void;
  onUploadError?: (error: string) => void;
  onUploadDone?: (url: string) => void;
  preventSetValue?: boolean;
  disabled?: boolean;
  circle?: boolean;
  dark?: boolean;
  id?: string;
}
export interface FreezedMediaInputProps {
  type?: FreezedMediaInputTypes;
  label: string;
  onChange: (url: string) => void;
  value: string;
  validationError?: string;
  hint?: string;
  imageUrl?: string;
  className?: string;
  maximumFileSizeInKB?: number;
  imageAspectRatio?: number;
  disableImageCropper?: boolean;
  required?: boolean;
  hideUpload?: boolean;
  size?: "small" | "medium" | "big" | "grid-fit";
  containerImageClassName?: string;
  onReset?: () => void;
  tooltipTitle?: string;
  initialData?: MediaInputData;
  multiple?: boolean;
  onSelectMultiple?: (datas: MediaInputData[]) => void;
  onUploadError?: (error: string) => void;
  onUploadDone?: (url: string) => void;
  preventSetValue?: boolean;
  disabled?: boolean;
  circle?: boolean;
}
