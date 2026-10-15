export interface CustomColorPickerProps {
  name: string;
  label?: string;
  type?: "color" | "gradient" | "full";
  value?: string;
  onChange?: (color: string) => void;
  size?: "small" | "medium";
  withClearIcon?: boolean;
  className?: string;
}
