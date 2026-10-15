import { Checkbox, FormControlLabel, Paper, Typography } from "@mui/material";
import clsx from "clsx";
import { MultiCheckboxFilterFieldProps } from "../Utils";

function MultiCheckboxFilterField({
  title = "",
  titleClassName = "",
  onChange,
  handleCloseMenu,
  items = [],
  closeOnChange = false,
}: MultiCheckboxFilterFieldProps) {
  return (
    <div className="flex space-x-8">
      <Typography className={clsx("mt-12", titleClassName)}>{title}</Typography>
      <Paper
        className="flex flex-col rounded-full border-1 shadow-0 px-8 w-full"
        style={{ borderRadius: 8 }}
      >
        {items.map((item, index) => (
          <FormControlLabel
            key={index}
            control={
              <Checkbox
                checked={item.checked}
                onChange={(e) => {
                  if (closeOnChange) {
                    handleCloseMenu?.();
                  }
                  onChange(e.target.checked, index);
                }}
              />
            }
            label={item.label}
          />
        ))}
      </Paper>
    </div>
  );
}

export default MultiCheckboxFilterField;
