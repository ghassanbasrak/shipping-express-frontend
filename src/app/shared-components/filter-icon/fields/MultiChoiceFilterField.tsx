import { Box, Chip, MenuItem, Paper, Select, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { getFilterItem, getFilterItems } from "../store/filterItemsSlice";
import { MultiChoiceFilterFieldProps } from "../Utils";
import { useDispatch } from "react-redux";
import { AppDispatch } from "app/store/store";

function MultiChoiceFilterField({
  title = "",
  titleClassName = "",
  value = [],
  onChange,
  handleCloseMenu,
  items = [],
  closeOnChange = false,
  remote = false,
  getOptionLabel = (option) => (option ? option.name : ""),
  getItemsUrl,
  getItemUrl,
}: MultiChoiceFilterFieldProps) {
  const dispatch = useDispatch<AppDispatch>(); // Use typed dispatch
  const [remoteItemsLoading, setRemoteItemsLoading] = useState(false);
  const [remoteItems, setRemoteItems] = useState<any[]>([]);

  useEffect(() => {
    if (remote && getItemUrl && value.length > 0) {
      // Assuming value can be an empty array
      dispatch(getFilterItem({ getItemUrl, id: value[0] as any })).then(
        (action) => {
          if (action.payload) {
            const list = [action.payload, ...items];
            setRemoteItems(list);
          }
        }
      );
    }
  }, [dispatch, remote, getItemUrl, value]);

  useEffect(() => {
    if (remote && getItemsUrl) {
      setRemoteItemsLoading(true);
      dispatch(getFilterItems({ getItemsUrl })).then((action) => {
        if (action.payload) {
          setRemoteItems(action.payload as any[]);
          setRemoteItemsLoading(false);
        }
      });
    } else {
      if (remote) {
        onChange([]);
        setRemoteItems([]);
      }
    }
  }, [remote, getItemsUrl]);
  console.log(value, "valueeeeeeeeee");
  return (
    <div className="flex space-x-8 items-center">
      <Typography className={titleClassName}>{title}</Typography>
      <Paper
        className="flex items-center rounded-full border-1 shadow-0 px-4 w-full"
        style={{ borderRadius: 8 }}
      >
        <Select
          className="flex flex-1 whitespace-nowrap mx-4"
          disableUnderline
          variant="standard"
          multiple
          value={value}
          onChange={(e) => {
            if (closeOnChange) {
              handleCloseMenu?.();
            }
            onChange(remote ? e.target.value : e);
          }}
          style={{ marginTop: 1 }}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((value, index) => (
                <Chip
                  key={index}
                  label={items.find((i) => i.value === value)?.label}
                />
              ))}
            </Box>
          )}
        >
          {(remote ? remoteItems : items).map((item, index) => (
            <MenuItem key={index} value={remote ? item.id : item.value}>
              {remote ? getOptionLabel(item) : item.label}
            </MenuItem>
          ))}
        </Select>
      </Paper>
    </div>
  );
}

export default MultiChoiceFilterField;
