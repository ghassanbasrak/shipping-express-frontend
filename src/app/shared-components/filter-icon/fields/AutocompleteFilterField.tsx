import {
  Autocomplete,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Fragment, useEffect, useState } from "react";
import {
  getFilterItem,
  getFilterItems,
  getFilterItemsOneByOne,
} from "../store/filterItemsSlice";
import { AutocompleteFilterFieldProps } from "../Utils";
import { AppDispatch } from "app/store/store";
import { useDispatch } from "react-redux";
import localeString from "src/app/main/utils/localeString";

function AutocompleteFilterField({
  title = "",
  titleClassName = "",
  placeholder = "",
  value,
  onChange,
  handleCloseMenu,
  closeOnChange = false,
  getItemUrl,
  getItemsUrl,
  getOptionLabel = (option: any) =>
    option
      ? option?.name
        ? typeof option?.name === "object"
          ? localeString(option?.name)
          : option?.name
        : option?.title
          ? typeof option?.title === "object"
            ? localeString(option?.title)
            : option?.title
          : option?.label
            ? typeof option?.label === "object"
              ? localeString(option?.label)
              : option.label
            : option
      : "",
  isOptionEqualToValue = (option, value) => option?.id === value?.id,
  onSelectItem,
  onSelectItems,
  multiple = false,
}: AutocompleteFilterFieldProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsSearchBy, setItemsSearchBy] = useState(null);
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (multiple) {
      if (value && value.length > 0) {
        dispatch(getFilterItemsOneByOne({ getItemUrl, ids: value })).then(
          (action) => {
            if (action.payload) {
              const list = [...action.payload, ...items];
              setItemsSearchBy(getOptionLabel(action.payload));
              setItems(list);
              if (onSelectItems) {
                onSelectItems(action.payload);
              }
            }
          }
        );
      }
    } else {
      if (value) {
        dispatch(getFilterItem({ getItemUrl, id: value })).then((action) => {
          if (action.payload) {
            const list = [action.payload, ...items];
            setItemsSearchBy(getOptionLabel(action.payload));
            setItems(list);
            if (onSelectItem) {
              onSelectItem(action.payload);
            }
          }
        });
      }
    }
  }, [dispatch]);
  const handleChangeSearchItems = (searchBy) => {
    if (itemsSearchBy !== searchBy) {
      setItemsSearchBy(searchBy);
      if (searchBy) {
        setItemsLoading(true);
        dispatch(getFilterItems({ getItemsUrl, searchBy: searchBy })).then(
          (action) => {
            setItemsLoading(false);
            if (action.payload) {
              const ctr = value;
              const list = [
                ...items.filter((item) =>
                  multiple
                    ? ctr.findIndex((id) => item.id === id) > -1
                    : ctr === (item._id || item.id)
                ),
                ...(action.payload as any[]).filter((item) =>
                  multiple
                    ? !ctr.find((id) => (item._id || item.id) === id)
                    : ctr !== (item._id || item.id)
                ),
              ];
              setItems(list);
            }
          }
        );
      }
    }
  };
  return (
    (!value || items.findIndex((i) => (i._id || i.id) === value) > -1) && (
      <div className="flex space-x-8 items-center">
        <Typography className={titleClassName}>{title}</Typography>
        <Paper
          className="flex items-center rounded-full border-1 shadow-0 px-4 w-full"
          style={{ borderRadius: 8 }}
        >
          <Autocomplete
            multiple={multiple}
            className="flex flex-1"
            options={items}
            getOptionLabel={getOptionLabel}
            value={
              multiple
                ? value === null
                  ? []
                  : value?.map((id) => items.find((item) => item.id === id)) ??
                    []
                : items.find((item) => item.id === value)
            }
            isOptionEqualToValue={isOptionEqualToValue}
            filterSelectedOptions={multiple}
            onChange={(_, data) => {
              setItemsSearchBy("");
              if (data) {
                if (closeOnChange) {
                  handleCloseMenu();
                }
                onChange(multiple ? data.map((item) => item.id) : data.id);
                if (multiple) {
                  if (onSelectItems) {
                    onSelectItems(data);
                  }
                } else {
                  if (onSelectItem) {
                    onSelectItem(data);
                  }
                }
              }
            }}
            loading={itemsLoading}
            inputValue={itemsSearchBy}
            onInputChange={
              !multiple
                ? (_, value, reason) => {
                    if (reason === "clear") {
                      setItemsSearchBy("");
                      onChange(multiple ? [] : null);
                      if (multiple) {
                        if (onSelectItems) {
                          onSelectItems([]);
                        }
                      } else {
                        if (onSelectItem) {
                          onSelectItem(null);
                        }
                      }
                    }
                    handleChangeSearchItems(value);
                  }
                : undefined
            }
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={placeholder}
                fullWidth
                variant="standard"
                onChange={
                  multiple
                    ? (e) => {
                        handleChangeSearchItems(e.target.value);
                      }
                    : undefined
                }
                InputProps={{
                  ...params.InputProps,
                  disableUnderline: true,
                  endAdornment: (
                    <Fragment>
                      {itemsLoading ? (
                        <CircularProgress color="inherit" size={17} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </Fragment>
                  ),
                }}
              />
            )}
          />
        </Paper>
      </div>
    )
  );
}

export default AutocompleteFilterField;
