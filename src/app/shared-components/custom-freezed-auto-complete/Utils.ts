import {
  AutocompleteOwnerState,
  AutocompleteRenderGetTagProps,
  AutocompleteRenderOptionState,
} from "@mui/material";
import { HTMLAttributes, ReactNode } from "react";

export interface CustomFreezedAutoCompleteProps<T> {
  label?: string;
  getItemUrl: string;
  getItemsUrl: string;
  getOptionLabel?: (option: T) => string;
  isOptionEqualToValue?: (option: T, value: any) => boolean;
  placeholder?: string;
  onChange?: (value: any) => void;
  value?: string | string[];
  error?: boolean;
  helperText?: string;
  onSelectItem?: (item: any) => void;
  onSelectItems?: (items: any[]) => void;
  resetSensitiveValues?: any[];
  filterItemBy?: (item: any[]) => boolean;
  multiple?: boolean;
  className?: string;
  defaultItem?: any;
  defaultItems?: any[];
  defaultItemId?: any;
  defaultItemIds?: any[];
  required?: boolean;
  size?: "small" | "medium";
  textFieldSx?: object;
  renderTags?: (
    value: T[],
    getTagProps: AutocompleteRenderGetTagProps,
    ownerState: AutocompleteOwnerState<any, boolean, false, false, "div">
  ) => ReactNode;
  withColorsInsideTags?: boolean;
  getTagColor?: (option: T) => string;
  renderOptions?: (
    props: HTMLAttributes<HTMLLIElement>,
    option: any,
    state: AutocompleteRenderOptionState,
    ownerState: AutocompleteOwnerState<any, boolean, false, false, "div">
  ) => ReactNode;
  withColorsInsideOptions?: boolean;
  getOptionColor?: (option: T) => string;
  onAutoCompleteInitilized?: () => void;
  disabled?: boolean;
}
