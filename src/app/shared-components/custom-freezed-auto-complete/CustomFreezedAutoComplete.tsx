import { useDispatch } from "react-redux";
import { CustomFreezedAutoCompleteProps } from "./Utils";
import { AppDispatch } from "app/store/store";
import { Fragment, useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  TextField,
} from "@mui/material";
import {
  getCustomFreezedAutoCompleteItem,
  getCustomFreezedAutoCompleteItems,
  getCustomFreezedAutoCompleteItemsOneByOne,
} from "./store/customFreezedAutoCompleteSlice";
import localeString from "src/app/main/utils/localeString";
import { useDeepCompareEffect } from "@fuse/hooks";

function CustomFreezedAutoComplete<T extends object & { id: string }>({
  label,
  placeholder,
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
  onChange,
  value,
  error,
  helperText,
  onSelectItem,
  onSelectItems,
  resetSensitiveValues,
  filterItemBy,
  defaultItem,
  defaultItems,
  defaultItemId,
  defaultItemIds,
  className = "mt-8 mb-16",
  multiple = false,
  required = true,
  size,
  textFieldSx,
  renderTags,
  withColorsInsideTags,
  getTagColor = (option: any) => (option ? option.color : ""),
  renderOptions,
  withColorsInsideOptions,
  getOptionColor = (option: any) => (option ? option.color : ""),
  onAutoCompleteInitilized,
  disabled = false,
}: CustomFreezedAutoCompleteProps<T>) {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedColor, setSelectedColor] = useState(
    defaultItem ? getOptionColor(defaultItem) : ""
  );
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsSearchBy, setItemsSearchBy] = useState("");
  const [items, setItems] = useState(
    multiple
      ? defaultItems
        ? defaultItems
        : []
      : defaultItem
        ? [defaultItem]
        : []
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (multiple) {
      if (
        defaultItemIds &&
        defaultItemIds.length > 0 &&
        (!defaultItems || defaultItems.length === 0)
      ) {
        dispatch(
          getCustomFreezedAutoCompleteItemsOneByOne({
            getItemUrl,
            ids: defaultItemIds,
          })
        ).then((action) => {
          if (action.payload) {
            const list = [...action.payload];
            setItemsSearchBy(getOptionLabel(action.payload));
            setItems((previousItems) => [...list, ...previousItems]);
            if (onSelectItems) {
              onSelectItems(action.payload);
            }
            setTimeout(() => {
              setReady(true);
            }, 200);
          }
        });
      } else {
        setReady(true);
      }
    } else {
      if (defaultItemId && !defaultItem) {
        dispatch(
          getCustomFreezedAutoCompleteItem({ getItemUrl, id: defaultItemId })
        ).then((action) => {
          if (action.payload) {
            const list = [action.payload];
            setItemsSearchBy(getOptionLabel(action.payload));
            setItems((previousItems) => [...list, ...previousItems]);
            if (onSelectItem) {
              onSelectItem(action.payload);
            }
            setTimeout(() => {
              setReady(true);
            }, 200);
          }
        });
      } else {
        setReady(true);
      }
    }
  }, [defaultItemId, defaultItemIds]);

  useDeepCompareEffect(() => {
    if (resetSensitiveValues && resetSensitiveValues.length > 0) {
      onChange(multiple ? [] : null);
      setItems([]);
      setItemsSearchBy("");
      if (resetSensitiveValues.every((value) => Boolean(value))) {
        getItems();
      }
    } else {
      getItems();
    }
  }, [resetSensitiveValues, dispatch]);

  const handleChangeSearchItems = (searchBy?: string) => {
    if (itemsSearchBy !== searchBy) {
      setItemsSearchBy(searchBy);
      if (searchBy) {
        getItems(searchBy);
      }
    }
  };
  function getItems(searchBy?: string) {
    setItemsLoading(true);
    dispatch(
      getCustomFreezedAutoCompleteItems({ getItemsUrl, searchBy: searchBy })
    ).then((action) => {
      setItemsLoading(false);
      if (action.payload) {
        const ctr = value;

        setItems((previousItems) => {
          const list = [
            ...previousItems.filter((item) =>
              multiple
                ? (ctr as string[] | undefined | null)?.findIndex(
                    (id) => item.id === id
                  ) > -1
                : ctr === (item._id || item.id) &&
                  (!filterItemBy || filterItemBy(item))
            ),
            ...(action.payload as any[]).filter((item) =>
              multiple
                ? !(ctr as string[] | undefined | null)?.find(
                    (id) => (item._id || item.id) === id
                  )
                : ctr !== (item._id || item.id)
            ),
          ];
          return list;
        });
      }
    });
  }
  useEffect(() => {
    if (multiple && onAutoCompleteInitilized) {
      onAutoCompleteInitilized();
    }
  }, [ready, multiple, value]);
  if (!ready || (multiple && value === null)) {
    return;
  }
  return (
    <Autocomplete
      multiple={multiple}
      className={className}
      options={items}
      getOptionLabel={getOptionLabel}
      size={size}
      disabled={disabled}
      value={
        multiple
          ? value === null
            ? []
            : (value as string[] | null | undefined)?.map((id) =>
                items.find((item) => item.id === id)
              ) ?? []
          : items.find((item) => item.id === value)
      }
      isOptionEqualToValue={isOptionEqualToValue}
      filterSelectedOptions={multiple}
      onChange={(_, data) => {
        setItemsSearchBy("");
        if (data) {
          if (onChange) {
            onChange(multiple ? data.map((item) => item.id) : data.id);
          }
          if (!multiple && withColorsInsideOptions) {
            setSelectedColor(getOptionColor(data));
          }
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
                onChange(null);
                if (!multiple && withColorsInsideOptions) {
                  setSelectedColor("");
                }
                if (onChange) {
                  onChange(null);
                }
                if (onSelectItem) {
                  onSelectItem(null);
                }
              }
              handleChangeSearchItems(value);
            }
          : undefined
      }
      renderOption={
        renderOptions ??
        (withColorsInsideOptions
          ? (props, option) => (
              <Box
                component="li"
                sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                {...props}
              >
                <div
                  className="rounded-full border-1 border-grey w-20 h-20 me-16"
                  style={{ backgroundColor: getOptionColor(option) }}
                />
                {getOptionLabel(option)}
              </Box>
            )
          : undefined)
      }
      renderTags={
        renderTags ??
        (withColorsInsideTags
          ? (values, getTagProps, ownerState) =>
              values.map((value, index) => (
                <Chip
                  avatar={
                    <div
                      className="rounded-full border-1 border-grey"
                      style={{ backgroundColor: getTagColor(value) }}
                    />
                  }
                  sx={{ bgcolor: "rgba(0, 0, 0, 0.05)" }}
                  variant="outlined"
                  label={getOptionLabel(value)}
                  {...getTagProps({ index })}
                />
              ))
          : undefined)
      }
      renderInput={(params) => {
        return (
          <div className="flex items-center w-full space-x-16">
            {!multiple && withColorsInsideOptions && (
              <div
                className="rounded-full border-1 border-grey w-28 h-28"
                style={{ backgroundColor: selectedColor }}
              />
            )}
            <TextField
              {...params}
              error={error}
              required={required}
              helperText={helperText}
              label={label}
              placeholder={placeholder}
              fullWidth
              size={size}
              sx={textFieldSx}
              InputLabelProps={{
                shrink: multiple
                  ? !!itemsSearchBy || (value && value.length > 0)
                  : !!itemsSearchBy,
              }}
              onChange={
                multiple
                  ? (e) => {
                      handleChangeSearchItems(e.target.value);
                    }
                  : undefined
              }
              InputProps={{
                ...params.InputProps,
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
          </div>
        );
      }}
    />
  );
}

export default CustomFreezedAutoComplete;
