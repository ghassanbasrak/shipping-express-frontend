import { ReactNode, useEffect, useState } from "react";
import {
  FormProvider,
  Controller,
  FieldValues,
  useForm,
  useFormContext,
} from "react-hook-form";
import { z, ZodTypeAny } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useTranslation } from "react-i18next";
import { useGetAuthPlacesQuery } from "../AuthApi";
import Autocomplete from "@mui/material/Autocomplete";

export function AuthForm({
  schema,
  defaults,
  onSubmit,
  children,
  submit,
  disabled = false,
}: {
  schema: ZodTypeAny;
  defaults: FieldValues;
  onSubmit: (values: FieldValues) => Promise<unknown>;
  children: ReactNode;
  submit: string;
  disabled?: boolean;
}) {
  const methods = useForm({
    defaultValues: defaults,
    resolver: zodResolver(schema),
    mode: "onChange",
  });
  const [error, setError] = useState("");
  const { t } = useTranslation("ashamcoAuth");
  return (
    <FormProvider {...methods}>
      <form
        noValidate
        className="flex flex-col gap-20"
        onSubmit={methods.handleSubmit(async (values) => {
          setError("");
          try {
            await onSubmit(values);
          } catch {
            setError(t("ERROR"));
          }
        })}
      >
        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}
        {children}
        <LoadingButton
          color="primary"
          type="submit"
          variant="contained"
          fullWidth
          loading={methods.formState.isSubmitting}
          disabled={disabled}
        >
          {submit}
        </LoadingButton>
      </form>
    </FormProvider>
  );
}

export function AuthField({
  name,
  label,
  type = "text",
  disabled = false,
  options,
}: {
  name: string;
  label: string;
  type?: string;
  disabled?: boolean;
  options?: { value: string; label: string }[];
}) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          label={label}
          type={type}
          disabled={disabled}
          fullWidth
          select={Boolean(options)}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          inputProps={type === "tel" ? { dir: "ltr" } : {}}
        >
          {options?.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
export function TermsField() {
  const { control } = useFormContext();
  const { t } = useTranslation("ashamcoAuth");
  return (
    <Controller
      name="acceptTermsConditions"
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(field.value)}
                onChange={field.onChange}
              />
            }
            label={t("TERMS")}
          />
          {fieldState.error && (
            <Alert severity="error">{fieldState.error.message}</Alert>
          )}
          <a
            href="https://ashamcoex.com/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            {t("TERMS_LINK")}
          </a>
        </div>
      )}
    />
  );
}
export function AddressFields() {
  const { control, watch, setValue } = useFormContext();
  const { t, i18n } = useTranslation("ashamcoAuth");
  const countryId = watch("address.countryId");
  const stateId = watch("address.stateId");
  return (
    <>
      {(["countries", "states", "cities"] as const).map((kind, i) => (
        <PlaceField
          key={kind}
          kind={kind}
          name={`address.${["countryId", "stateId", "cityId"][i]}`}
          label={t(["COUNTRY", "STATE", "CITY"][i])}
          countryId={countryId}
          stateId={stateId}
          onChange={() => {
            if (kind === "countries")
              setValue("address.stateId", "", { shouldValidate: true });
            if (kind !== "cities")
              setValue("address.cityId", "", { shouldValidate: true });
          }}
        />
      ))}
      <AuthField name="address.street" label={t("STREET")} />
      <AuthField name="address.zipCode" label={t("ZIP_CODE")} />
    </>
  );
}
function PlaceField({
  kind,
  name,
  label,
  countryId,
  stateId,
  onChange,
}: {
  kind: "countries" | "states" | "cities";
  name: string;
  label: string;
  countryId: string;
  stateId: string;
  onChange: () => void;
}) {
  const { control } = useFormContext();
  const { i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const { data, isFetching, isError, refetch } = useGetAuthPlacesQuery(
    {
      kind,
      countryId: kind === "countries" ? undefined : countryId,
      stateId: kind === "cities" ? stateId : undefined,
      search,
    },
    {
      skip:
        kind !== "countries" && (!countryId || (kind === "cities" && !stateId)),
    },
  );
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <Autocomplete
            options={data?.results ?? []}
            value={
              data?.results.find((item) => item.id === field.value) ??
              (field.value
                ? {
                    id: field.value,
                    name: { en: field.value, ar: field.value },
                  }
                : null)
            }
            getOptionLabel={(item) =>
              item.name[i18n.language] ||
              item.name.en ||
              item.name.ar ||
              item.id
            }
            isOptionEqualToValue={(a, b) => a.id === b.id}
            loading={isFetching}
            disabled={
              kind !== "countries" &&
              (!countryId || (kind === "cities" && !stateId))
            }
            onInputChange={(_, value, reason) => {
              if (reason === "input") setSearch(value);
            }}
            onChange={(_, item) => {
              field.onChange(item?.id ?? "");
              setSearch("");
              onChange();
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                name={field.name}
                inputRef={field.ref}
                onBlur={field.onBlur}
                label={label}
                error={Boolean(fieldState.error) || isError}
                helperText={fieldState.error?.message}
              />
            )}
          />
          {isError && (
            <Button
              color="primary"
              variant="outlined"
              onClick={() => refetch()}
            >
              ↻
            </Button>
          )}
        </div>
      )}
    />
  );
}
export function useOtpChallenge() {
  const [messageId, setMessageId] = useState("");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!seconds) return;
    const timer = setTimeout(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [seconds]);
  return {
    messageId,
    seconds,
    sent: Boolean(messageId),
    start: (id: string) => {
      setMessageId(id);
      setSeconds(120);
    },
    clear: () => {
      setMessageId("");
    },
  };
}
export const digits = (value: string) =>
  value.replace(/[٠-٩]/g, (char) => String("٠١٢٣٤٥٦٧٨٩".indexOf(char)));
export function validation(t: (key: string) => string) {
  const required = z.string().trim().min(1, t("REQUIRED"));
  return {
    required,
    email: z.string().trim().email(t("INVALID_EMAIL")),
    password: z.string().min(8, t("PASSWORD_MIN")),
    phoneCountry: z
      .string()
      .transform(digits)
      .pipe(z.string().regex(/^\+[1-9]\d{0,3}$/, t("INVALID_PHONE"))),
    phone: z
      .string()
      .transform(digits)
      .pipe(z.string().regex(/^[1-9]\d{4,14}$/, t("INVALID_PHONE"))),
    code: z
      .string()
      .transform(digits)
      .pipe(z.string().regex(/^\d{4}$/, t("INVALID_CODE"))),
  };
}
