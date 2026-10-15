import { useDispatch } from "react-redux";
import { CustomAutoCompleteProps } from "./Utils";
import { AppDispatch } from "app/store/store";
import { Fragment, useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  getCustomAutoCompleteItem,
  getCustomAutoCompleteItems,
  getCustomAutoCompleteItemsOneByOne,
} from "./store/customAutoCompleteSlice";
import localeString from "src/app/main/utils/localeString";
import { useDeepCompareEffect } from "@fuse/hooks";

function CustomAutoComplete<T extends object & { id: string }>({
  name,
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
  renderOption,
  withColorsInsideOptions,
  getOptionColor = (option: any) => (option ? option.color : ""),
  onAutoCompleteInitilized,
  disabled = false,
  disabledTooltip,
  onFocus,
}: CustomAutoCompleteProps<T>) {
  const dispatch = useDispatch<AppDispatch>();
  const methods = useFormContext();
  const { control, getValues, getFieldState, setValue, watch } = methods;
  const [selectedColor, setSelectedColor] = useState(
    defaultItem ? getOptionColor(defaultItem) : "",
  );
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsSearchBy, setItemsSearchBy] = useState(
    defaultItem ? getOptionLabel(defaultItem) : "",
  );
  const [items, setItems] = useState(
    multiple
      ? defaultItems
        ? defaultItems
        : []
      : defaultItem
        ? [defaultItem]
        : [],
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
          getCustomAutoCompleteItemsOneByOne({
            getItemUrl,
            ids: defaultItemIds,
          }),
        ).then((action) => {
          if (action.payload) {
            const list = [...action.payload];
            // setItemsSearchBy(getOptionLabel(action.payload));
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
          getCustomAutoCompleteItem({ getItemUrl, id: defaultItemId }),
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
      setValue(name, multiple ? [] : null, { shouldDirty: true });
      setItemsSearchBy("");
      setItems([]);
      onSelectItem?.(null);
      onSelectItems?.(null);
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
      getCustomAutoCompleteItems({ getItemsUrl, searchBy: searchBy }),
    ).then((action) => {
      setItemsLoading(false);
      if (action.payload) {
        const ctr = getValues(name);

        setItems((previousItems) => {
          const list = [
            ...previousItems.filter((item) =>
              multiple
                ? ctr?.findIndex((id) => item.id === id) > -1
                : ctr === (item._id || item.id) &&
                  (!filterItemBy || filterItemBy(item)),
            ),
            ...(action.payload as any[]).filter((item) =>
              multiple
                ? !ctr?.find((id) => (item._id || item.id) === id)
                : ctr !== (item._id || item.id),
            ),
          ];
          return list;
        });
      }
    });
  }
  const value = watch(name);
  useEffect(() => {
    if (multiple && onAutoCompleteInitilized) {
      onAutoCompleteInitilized();
    }
  }, [ready, multiple, value]);
  if (!ready || (multiple && value === null)) {
    return;
  }
  return (
    <Tooltip
      title={disabled && disabledTooltip ? disabledTooltip : undefined}
      arrow
    >
      <div className="w-full">
        <Controller
          name={name}
          control={control}
          key={name}
          render={({ field }) => (
            <Autocomplete
              {...field}
              multiple={multiple}
              id={name}
              className={className}
              options={items}
              getOptionLabel={getOptionLabel}
              size={size}
              disabled={disabled}
              value={
                multiple
                  ? field.value === null
                    ? []
                    : field.value?.map((id) =>
                        items.find((item) => item.id === id),
                      ) ?? []
                  : items.find((item) => item.id === field.value)
              }
              isOptionEqualToValue={isOptionEqualToValue}
              filterSelectedOptions={multiple}
              onChange={(_, data) => {
                setItemsSearchBy("");
                if (data) {
                  field.onChange(
                    multiple ? data.map((item) => item?.id) : data.id,
                  );
                  if (!multiple) {
                    setItemsSearchBy(getOptionLabel(data));
                  }
                  if (!multiple && withColorsInsideOptions) {
                    setSelectedColor(getOptionColor(data));
                  }
                  if (onChange) {
                    onChange(multiple ? data.map((item) => item.id) : data.id);
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
                        field.onChange(null);
                        if (!multiple && withColorsInsideOptions) {
                          setSelectedColor("");
                        }
                        if (onChange) {
                          onChange(null);
                        }
                        if (onSelectItem) {
                          onSelectItem(null);
                        }
                      } else if (reason === "input") {
                        handleChangeSearchItems(value);
                      }
                    }
                  : undefined
              }
              renderOption={
                renderOption ??
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
                const error = getFieldState(name).invalid;
                const helperText = getFieldState(name)?.error?.message;
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
                      onFocus={onFocus}
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
                          ? !!itemsSearchBy ||
                            (field.value && field.value.length > 0)
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
          )}
        />
      </div>
    </Tooltip>
  );
}

export default CustomAutoComplete;
