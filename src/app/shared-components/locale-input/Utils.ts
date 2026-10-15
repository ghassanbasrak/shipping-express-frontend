export interface LocaleInputProps {
  name: string;
  label?: string;
  inputType?: string;
  languages?: string[];
  requiredLanguages?: string[];
  variant?: "filled" | "outlined" | "standard";
  size?: "small" | "medium";
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  sx?: object;
  onEditorSizeChange?: () => void;
  className?: string;
  containerClassName?: string;
  id?: string;
}

export const localeInputTypes = {
  textField: "textField",
  textFieldMultiple: "textFieldMultiple",
  editor: "editor",
};
