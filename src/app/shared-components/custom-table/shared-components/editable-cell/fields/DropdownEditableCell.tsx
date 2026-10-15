import {
  CircularProgress,
  IconButton,
  InputAdornment,
  InputBase,
  MenuItem,
  Select,
  SelectProps,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ChangeEvent, KeyboardEvent } from "react";
import { FieldEditableCellProps } from "app/shared-components/custom-table/Utils";

interface DropdownEditableCellProps
  extends Omit<FieldEditableCellProps, "inputProps"> {
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputProps: SelectProps;
  options?: { value: any; label: string }[];
}

function DropdownEditableCell({
  ref,
  defaultValue,
  editValue,
  loading,
  disabled,
  inputProps,
  options,
  handleChange,
  handleKeyDown,
  handleCancel,
}: DropdownEditableCellProps) {
  return (
    <Select
      ref={ref}
      value={editValue}
      defaultValue={defaultValue}
      onKeyDownCapture={handleKeyDown}
      onChange={handleChange}
      disabled={loading || disabled}
      autoFocus
      input={
        <InputBase
          startAdornment={
            <InputAdornment position="start">
              {loading ? (
                <CircularProgress className="m-6" color="primary" size={17.5} />
              ) : (
                <IconButton onClick={handleCancel} size="small" color="error">
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </InputAdornment>
          }
        />
      }
      sx={{
        flexGrow: 1,
        fontSize: "inherit",
        lineHeight: "inherit",
        color: "inherit",
      }}
      {...inputProps}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
}

export default DropdownEditableCell;
