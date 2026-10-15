import {
  Checkbox,
  CheckboxProps,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { ChangeEvent, KeyboardEvent } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { FieldEditableCellProps } from "app/shared-components/custom-table/Utils";

interface CheckboxEditableCellProps
  extends Omit<FieldEditableCellProps, "inputProps"> {
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  inputProps: CheckboxProps;
  options?: { value: any; label: string }[];
}
function CheckboxEditableCell({
  ref,
  editValue,
  loading,
  disabled,
  inputProps,
  handleChange,
  handleKeyDown,
  handleCancel,
}: CheckboxEditableCellProps) {
  return (
    <div className="flex items-center w-full">
      {loading ? (
        <CircularProgress className="m-6" color="primary" size={17.5} />
      ) : (
        <IconButton onClick={handleCancel} size="small" color="error">
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      <Checkbox
        ref={ref}
        disabled={loading || disabled}
        className="p-0"
        onKeyDown={handleKeyDown}
        checked={editValue}
        onChange={handleChange}
        size="small"
        {...inputProps}
      />
    </div>
  );
}

export default CheckboxEditableCell;
