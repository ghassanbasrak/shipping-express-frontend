import { ChangeEvent, ReactNode } from "react";

export interface FilterIconProps<T> {
  filters: (
    | AutocompleteFilterFieldProps
    | DateTimeFilterFieldProps
    | DropdownFilterFieldProps<T>
    | InputFilterFieldProps
    | MultiCheckboxFilterFieldProps
    | MultiChoiceFilterFieldProps
    | SwitchFilterFieldProps
  )[];
  menuItemClassName?: string;
  menuLabelClassName?: string;
  component?: React.ComponentType<any>;
  componentProps?: object;
  changesCount?: number;
  badgeVariant?: "dot" | "standard";
  badgeColor?:
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning";
}

export enum FilterTypes {
  input,
  switch,
  autocomplete,
  dropdown,
  multiCheckbox,
  dateTime,
  multiChoice,
}
export interface AutocompleteFilterFieldProps extends FilterFieldProps {
  type: FilterTypes.autocomplete;
  placeholder?: string;
  value?: any;
  onChange: (value: string | string[]) => void;
  getItemUrl: string;
  getItemsUrl: string;
  getOptionLabel?: (option: any) => string;
  isOptionEqualToValue?: (option: any, value: any) => boolean;
  onSelectItem?: (item: any) => void;
  onSelectItems?: (item: any) => void;
  multiple?: boolean;
}
export interface DateTimeFilterFieldProps extends FilterFieldProps {
  type: FilterTypes.dateTime;
  placeholder?: string;
  value?: Date;
  onChange: (value: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disableTime?: boolean;
}

export interface DropdownFilterFieldProps<T> extends FilterFieldProps {
  type: FilterTypes.dropdown;
  value?: T | string;
  onChange: (value: any) => void;
  items: { label: string; value: T | string }[];
  remote?: boolean;
  getOptionLabel?: (option: any) => string;
  getItemsUrl?: string;
  getItemUrl?: string;
}

export interface InputFilterFieldProps extends FilterFieldProps {
  type: FilterTypes.input;
  placeholder?: string;
  value?: string;
  inputType?: string;
  endAdornment?: ReactNode;
  startAdornment?: ReactNode;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

export interface MultiCheckboxFilterFieldProps extends FilterFieldProps {
  type: FilterTypes.multiCheckbox;
  onChange: (checked: boolean, index: number) => void;
  items: { label: string; checked: boolean }[];
}

export interface MultiChoiceFilterFieldProps extends FilterFieldProps {
  type: FilterTypes.multiChoice;
  value?: any[];
  onChange: (value: any[] | any) => void;
  items: { label: string; value: any }[];
  remote?: boolean;
  getOptionLabel?: (option: any) => string; // Allow any type for option
  getItemsUrl?: string;
  getItemUrl?: string;
}

export interface SwitchFilterFieldProps extends FilterFieldProps {
  type: FilterTypes.switch;
  value?: string;
  onChange: (value: string) => void;
}

export interface FilterFieldProps {
  handleCloseMenu?: () => void;
  closeOnChange?: boolean;
  title: string;
  titleClassName?: string;
}
