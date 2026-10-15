import { Paper, Typography } from "@mui/material";
import { DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import { DateTimeFilterFieldProps } from "../Utils";

function DateTimeFilterField({
  title = "",
  titleClassName = "",
  placeholder,
  value,
  onChange,
  handleCloseMenu,
  closeOnChange = false,
  minDate,
  maxDate,
  disableTime = false,
}: DateTimeFilterFieldProps) {
  const Picker = disableTime ? DatePicker : DateTimePicker;

  return (
    <div className="flex space-x-8 items-center">
      <Typography className={titleClassName}>{title}</Typography>
      <Paper
        className="flex items-center rounded-full border-1 shadow-0 px-4 w-full pe-8"
        style={{ borderRadius: 8 }}
      >
        <Picker
          className="flex flex-1"
          value={value}
          onChange={(e) => {
            if (closeOnChange) {
              handleCloseMenu?.();
            }

            onChange(e);
          }}
          slotProps={{
            actionBar: { actions: ["clear"] },
            textField: {
              placeholder: placeholder,
              fullWidth: true,
              variant: "standard",
              InputProps: {
                disableUnderline: true,
              },
            },
          }}
          minDate={minDate}
          maxDate={maxDate}
        />
      </Paper>
    </div>
  );
}

export default DateTimeFilterField;
