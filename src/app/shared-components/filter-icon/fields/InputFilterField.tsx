import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import {
  Input,
  InputAdornment,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { InputFilterFieldProps } from "../Utils";

function InputFilterField({
  title = "",
  titleClassName = "",
  placeholder,
  value,
  onChange,
  inputType,
  endAdornment,
  startAdornment,
  handleCloseMenu,
  closeOnChange = false,
}: InputFilterFieldProps) {
  return (
    <div className="flex space-x-8 items-center">
      <Typography className={titleClassName}>{title}</Typography>
      <Paper
        className="flex items-center rounded-full border-1 shadow-0 px-4 w-full space-x-4"
        style={{ borderRadius: 8 }}
      >
        <FuseSvgIcon color="action" size={17}>
          heroicons-solid:search
        </FuseSvgIcon>

        <Input
          className="flex flex-1"
          placeholder={placeholder}
          disableUnderline
          fullWidth
          value={value}
          inputProps={{
            "aria-label": "Search",
          }}
          type={inputType}
          startAdornment={
            startAdornment ? (
              <InputAdornment position="start">{startAdornment}</InputAdornment>
            ) : undefined
          }
          endAdornment={
            endAdornment ? (
              <InputAdornment position="end">{endAdornment}</InputAdornment>
            ) : undefined
          }
          onChange={(e) => {
            if (closeOnChange) {
              handleCloseMenu?.(); // Optional chaining for handleCloseMenu
            }
            onChange(e);
          }}
        />
      </Paper>
    </div>
  );
}

export default InputFilterField;
