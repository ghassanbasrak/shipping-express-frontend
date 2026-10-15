import clsx from "clsx";
import { Controller, useFormContext } from "react-hook-form";
import { LocaleInputProps, localeInputTypes } from "./Utils";
import { useTranslation } from "react-i18next";
import { Autocomplete, TextField, Typography } from "@mui/material";
import WYSIWYGEditor from "../WYSIWYGEditor";

function LocaleInput({
  inputType = localeInputTypes.textField,
  label,
  name,
  languages = ["ar", "en"],
  requiredLanguages = ["ar"],
  variant = "outlined",
  className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-16",
  containerClassName = "mt-8 mb-20",
  multiline = false,
  rows,
  size = "medium",
  sx = {},
  onEditorSizeChange = () => {},
  disabled = false,
  id,
}: LocaleInputProps) {
  const { t } = useTranslation("public");
  const methods = useFormContext();
  const { control, getFieldState } = methods;
  return (
    <div className={containerClassName}>
      {getFieldState(`${name}`).invalid && (
        <Typography color="error" className="text-14 mb-4" textAlign="center">
          {getFieldState(`${name}`).error.message}
        </Typography>
      )}
      <div className={clsx(className, "")}>
        {languages
          .map((l) => l.toLowerCase())
          .map((language, index) => (
            <Controller
              key={index}
              name={`${name}.${language}`}
              control={control}
              defaultValue={
                inputType === localeInputTypes.textFieldMultiple ? [] : ""
              }
              render={({ field }) => {
                const error = getFieldState(`${name}.${language}`).invalid;
                const helperText = getFieldState(`${name}.${language}`)?.error
                  ?.message;
                return inputType === localeInputTypes.textField ? (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                    }}
                    error={error}
                    required={
                      requiredLanguages.findIndex((i) => i === language) > -1
                    }
                    helperText={helperText}
                    label={label ? `${label} (${t(language)})` : undefined}
                    id={`${id || name}.${language}`}
                    variant={variant}
                    fullWidth
                    multiline={multiline}
                    rows={rows}
                    size={size}
                    sx={sx}
                    disabled={disabled}
                  />
                ) : inputType === localeInputTypes.textFieldMultiple ? (
                  <Autocomplete
                    {...field}
                    multiple
                    freeSolo
                    options={[]}
                    value={field.value}
                    onChange={(event, newValue) => {
                      field.onChange(newValue);
                    }}
                    disabled={disabled}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={t("TYPE_MULTIPLE_TEXTS")}
                        variant="outlined"
                        InputLabelProps={{
                          shrink: true,
                        }}
                        id={`${name}.${language}`}
                        error={error}
                        required={
                          requiredLanguages.findIndex((i) => i === language) >
                          -1
                        }
                        helperText={helperText}
                        label={`${label ?? ""} (${t(language)})`}
                        onPaste={(event) => {
                          event.preventDefault(); // Prevent the default paste behavior
                          const pastedData =
                            event.clipboardData.getData("text"); // Get pasted data as plain text
                          const newValues = pastedData
                            .split("\n")
                            .map((item) => item.trim())
                            .filter((item) => item); // Split by line breaks, trim, and filter empty items
                          field.onChange([...field.value, ...newValues]); // Update the state with new values
                        }}
                      />
                    )}
                  />
                ) : inputType === localeInputTypes.editor ? (
                  <div>
                    {error ? (
                      <Typography
                        color="error"
                        className="text-14 my-8"
                        textAlign="center"
                      >
                        {helperText}
                      </Typography>
                    ) : null}
                    <WYSIWYGEditor
                      {...field}
                      placeholder={
                        label ? `${label} (${t(language)})` : undefined
                      }
                      onSizeChange={onEditorSizeChange}
                      disabled={disabled}
                    />
                  </div>
                ) : (
                  <></>
                );
              }}
            />
          ))}
      </div>
    </div>
  );
}

export default LocaleInput;
