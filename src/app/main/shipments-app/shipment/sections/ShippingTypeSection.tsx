import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { defaultCountry } from "../../Utils";
import ShipmentChoiceTile from "../components/ShipmentChoiceTile";

const options = [
  {
    value: "local",
    icon: "heroicons-outline:home",
    title: "LOCAL",
    hint: "SHIPPING_TYPE_LOCAL_HINT",
  },
  {
    value: "international",
    icon: "heroicons-outline:globe",
    title: "INTERNATIONAL",
    hint: "SHIPPING_TYPE_INTERNATIONAL_HINT",
  },
];

export default function ShippingTypeSection({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation("shipmentsApp"),
    { watch, setValue, getValues } = useFormContext(),
    method = watch("method"),
    company = watch("shippingCompany");

  function choose(value: string) {
    if (value === method) return;
    const parties = [
      { prefix: "sender", path: "" },
      { prefix: "receiver", path: "" },
      ...(getValues("receivers") || []).map((_, index) => ({
        prefix: "receiver",
        path: `receivers.${index}.`,
      })),
    ];
    setValue("method", value, { shouldDirty: true });
    setValue("isCod", false);
    setValue("codPrice", 0);
    for (const { prefix, path } of parties) {
      for (const kind of ["State", "City"])
        for (const suffix of ["Id", "Name", ""])
          setValue(
            `${path}${prefix}${kind}${suffix}` as never,
            (suffix ? "" : null) as never,
          );
      setValue(
        `${path}${prefix}CountryId` as never,
        (value === "local" ? defaultCountry.id : "") as never,
      );
      setValue(
        `${path}${prefix}CountryName` as never,
        (value === "local" ? defaultCountry.name.en : "") as never,
      );
      setValue(
        `${path}${prefix}CountryCode` as never,
        (value === "local" ? defaultCountry.code : "") as never,
      );
    }
    // A carrier that cannot ship this way must be picked again after the addresses.
    if (company && !company.shippingMethods?.includes(value)) {
      setValue("shippingCompanyId", "", { shouldDirty: true });
      setValue("shippingCompany", null);
      setValue("couponCodeId", "");
      setValue("coupon", null);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("SHIPPING_TYPE")}
      className="grid grid-cols-1 gap-12 sm:grid-cols-2"
    >
      {options.map((option) => (
        <ShipmentChoiceTile
          key={option.value}
          icon={option.icon}
          title={t(option.title)}
          hint={t(option.hint)}
          active={method === option.value}
          disabled={disabled}
          testId={`shipping-type-${option.value}`}
          onClick={() => choose(option.value)}
        />
      ))}
    </div>
  );
}
