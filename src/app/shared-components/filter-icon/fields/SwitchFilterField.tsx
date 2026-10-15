import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { Input, Paper, Typography } from "@mui/material";
import { SwitchFilterFieldProps } from "../Utils";

function SwitchFilterField({
  title = "",
  titleClassName = "",
  value,
  onChange,
  handleCloseMenu,
  closeOnChange = false,
}: SwitchFilterFieldProps) {
  return (
    <div className="flex space-x-8 items-center">
      <Typography className={titleClassName}>{title}</Typography>
      <Paper
        className="flex items-center rounded-full border-1 shadow-0 px-4 w-full space-x-4"
        style={{ borderRadius: 8 }}
      >
        <FuseSvgIcon color="primary">heroicons-solid:search</FuseSvgIcon>
        <Input
          className="flex flex-1"
          disableUnderline
          fullWidth
          value={value}
          inputProps={{
            "aria-label": "Search",
          }}
          onChange={(e) => {
            if (closeOnChange) {
              handleCloseMenu?.();
            }
            onChange(e.target.value);
          }}
        />
      </Paper>
    </div>
  );
}

export default SwitchFilterField;
