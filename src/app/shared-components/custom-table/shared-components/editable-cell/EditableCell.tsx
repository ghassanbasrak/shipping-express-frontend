import {
  ChangeEvent,
  KeyboardEvent,
  Ref,
  SyntheticEvent,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Box, Tooltip, InputBaseProps, SelectProps } from "@mui/material";

import { useTranslation } from "react-i18next";
import TextFieldEditableCell from "./fields/TextFieldEditableCell";
import DropdownEditableCell from "./fields/DropdownEditableCell";
import CheckboxEditableCell from "./fields/CheckboxEditableCell";
import {
  EditableCellProps,
  EditableCellRef,
  EditableCellTypes,
} from "../../Utils";

const EditableCell = forwardRef(
  (
    {
      row,
      value,
      resetCell,
      onConfirmEdit,
      onCancelEdit,
      type = "textfield",
      options = [],
      onEdit,
      inputProps = {},
      disabled = false,
      disabledTitleGetter,
    }: EditableCellProps<keyof typeof EditableCellTypes>,
    ref: Ref<EditableCellRef>
  ) => {
    const { t } = useTranslation("public");
    const [editValue, setEditValue] = useState(value);

    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleConfirm = async (event?: SyntheticEvent<any>) => {
      if (event) {
        event.stopPropagation();
      }
      setLoading(true);
      try {
        await onConfirmEdit(editValue, row);
        resetCell();
      } catch (error) {
        console.error("Error confirming edit:", error);
        setEditValue(value); // Reset to the original value on error
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      handleConfirm: (event?: SyntheticEvent<any>) => {
        if (!(!!editValue && editValue !== value && !loading)) {
          return false;
        }
        handleConfirm();
        return true;
      },
    }));

    const handleCancel = (event?: SyntheticEvent<any>) => {
      if (event) {
        event.stopPropagation();
      }
      setEditValue(""); // Reset to original value
      if (onCancelEdit) {
        onCancelEdit(row);
      }
      resetCell();
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const newValue =
        type === "checkbox" ? event.target.checked : event.target.value;
      if (onEdit) {
        onEdit(newValue, row);
      }
      setEditValue(newValue);
    };

    const handleKeyDown = (
      event: KeyboardEvent<
        HTMLInputElement | HTMLSelectElement | HTMLButtonElement
      >
    ) => {
      event.stopPropagation();
      if (event.key === "Enter") {
        if (!!editValue && editValue !== value && !loading) {
          handleConfirm();
        }
      } else if (event.key === "Escape") {
        handleCancel();
      }
    };

    const toFieldComponent = (type: "textfield" | "dropdown" | "checkbox") => {
      switch (type) {
        case "textfield":
          return TextFieldEditableCell;
        case "dropdown":
          return DropdownEditableCell;
        case "checkbox":
          return CheckboxEditableCell;
      }
    };

    const FieldComponent = toFieldComponent(type);

    return (
      <Tooltip
        title={
          disabled && disabledTitleGetter
            ? disabledTitleGetter(row)
            : t("PRESS_ENTER_TO_SUBMIT")
        }
        open={
          (!!editValue && editValue !== value) ||
          (disabled && !!disabledTitleGetter)
        }
        placement="top"
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
            <FieldComponent
              ref={inputRef}
              disabled={disabled}
              loading={loading}
              handleChange={handleChange}
              handleKeyDown={handleKeyDown}
              handleCancel={handleCancel}
              inputProps={inputProps}
              defaultValue={value}
              editValue={editValue}
              options={options}
            />
          </Box>
        </Box>
      </Tooltip>
    );
  }
);

export default EditableCell;
