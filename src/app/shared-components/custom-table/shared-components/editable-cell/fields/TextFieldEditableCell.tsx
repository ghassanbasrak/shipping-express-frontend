import {
  CircularProgress,
  IconButton,
  InputAdornment,
  InputBase,
  InputBaseProps,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ChangeEvent, KeyboardEvent } from "react";
import { FieldEditableCellProps } from "app/shared-components/custom-table/Utils";

interface TextFieldEditableCellProps
  extends Omit<FieldEditableCellProps, "inputProps"> {
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputProps: InputBaseProps;
}
function TextFieldEditableCell({
  ref,
  editValue,
  loading,
  disabled,
  inputProps,
  handleChange,
  handleKeyDown,
  handleCancel,
}: TextFieldEditableCellProps) {
  return (
    <InputBase
      ref={ref}
      value={editValue}
      onChange={handleChange}
      size="small"
      disabled={loading || disabled}
      autoFocus
      onKeyDown={handleKeyDown}
      startAdornment={
        <InputAdornment position="start" className="mx-0">
          {loading ? (
            <CircularProgress className="m-6" color="primary" size={17.5} />
          ) : (
            <IconButton onClick={handleCancel} size="small" color="error">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </InputAdornment>
      }
      sx={{
        flexGrow: 1,
        marginRight: "2px",
        width: "100%",
        fontSize: "inherit",
        lineHeight: "inherit",
        color: "inherit",
        backgroundColor: "transparent",
        "& input": {
          padding: 0,
          textAlign: "inherit",
          border: "none",
          outline: "none",
        },
      }}
      {...inputProps}
    />
  );
}

export default TextFieldEditableCell;
