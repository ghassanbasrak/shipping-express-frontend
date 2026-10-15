import { ComponentConfig, Button as _Button } from "@measured/puck";
import styles from "./styles.module.css";
import getClassNameFactory from "../../getClassNameFactory";
import clsx from "clsx";
import CustomFreezedAutoComplete from "app/shared-components/custom-freezed-auto-complete/CustomFreezedAutoComplete";
import localeString from "src/app/main/utils/localeString";
import { Section } from "../../components/Section";

const getClassName = getClassNameFactory("Button", styles);
function getCarName(car) {
  if (!car) {
    return "";
  }
  return `${localeString(car.brand?.name ?? car.brand?.title)} ${localeString(car.model?.name ?? car.model?.title)} ${localeString(car.subModel?.name ?? car.subModel?.title)} ${car.year ?? ""}`;
}

const FieldLabel = ({ field }) => (
  <div
    style={{
      alignItems: "center",
      display: "flex",
      paddingBottom: "12px",
      fontSize: " var(--puck-font-size-xxs)",
      fontWeight: 600,
    }}
  >
    <div
      style={{
        color: "var(--puck-color-grey-07)",
        display: "flex",
        marginRight: "4px",
        paddingLeft: "4px",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        className="lucide lucide-check-circle "
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <path d="m9 11 3 3L22 4"></path>
      </svg>
    </div>
    {field.label}
  </div>
);
export type ButtonProps = {
  label: string;
  action: "link" | "openDialog";
  actionLink?:
    | "page"
    | "cars"
    | "brands"
    | "car"
    | "brand"
    | "offer"
    | "services"
    | "custom";
  pageId?: string;
  carId?: string;
  brandId?: string;
  offerId?: string;
  href?: string;
  dialogId?: string;
  target?: "_self" | "_blank";
  variant: "contained" | "outlined";
  color: "primary" | "secondary";
  size: "sm" | "default" | "lg";
  align: "start" | "center" | "end";
};
export const Button: ComponentConfig<ButtonProps> = {
  label: "Button",
  fields: {
    label: { label: "Label", type: "text" },
    action: {
      label: "Action",
      type: "radio",
      options: [
        { label: "Link", value: "link" },
        { label: "Open Dialog", value: "openDialog" },
      ],
    },

    actionLink: {
      label: "Link Type",
      type: "radio",
      options: [
        { label: "Page", value: "page" },
        { label: "Cars", value: "cars" },
        { label: "Brands", value: "brands" },
        { label: "Car", value: "car" },
        { label: "Brand", value: "brand" },
        { label: "Offer", value: "offer" },
        { label: "Services", value: "services" },
        { label: "Custom", value: "custom" },
      ],
    },
    pageId: {
      label: "Page",
      type: "custom",
      render: ({ id, value, field, onChange }) => {
        return (
          <div>
            <FieldLabel field={field} />
            <CustomFreezedAutoComplete
              placeholder="Select Single Page"
              getItemUrl="admin/pages"
              getItemsUrl="admin/pages"
              defaultItemId={value}
              onChange={onChange}
              value={value}
            />
          </div>
        );
      },
    },
    carId: {
      label: "Car",
      type: "custom",
      render: ({ id, value, field, onChange }) => {
        return (
          <div>
            <FieldLabel field={field} />
            <CustomFreezedAutoComplete
              placeholder="Select Single Car"
              getItemUrl="admin/models/Car"
              getItemsUrl="admin/models/Car"
              defaultItemId={value}
              onChange={onChange}
              value={value}
              getOptionLabel={getCarName}
            />
          </div>
        );
      },
    },
    brandId: {
      label: "Brand",
      type: "custom",
      render: ({ id, value, field, onChange }) => {
        return (
          <div>
            <FieldLabel field={field} />
            <CustomFreezedAutoComplete
              placeholder="Select Single Brand"
              getItemUrl="admin/models/Brand"
              getItemsUrl="admin/models/Brand"
              defaultItemId={value}
              onChange={onChange}
              value={value}
            />
          </div>
        );
      },
    },
    offerId: {
      label: "Offer",
      type: "custom",
      render: ({ id, value, field, onChange }) => {
        return (
          <div>
            <FieldLabel field={field} />
            <CustomFreezedAutoComplete
              placeholder="Select Single Offer"
              getItemUrl="admin/offers"
              getItemsUrl="admin/offers"
              defaultItemId={value}
              onChange={onChange}
              value={value}
            />
          </div>
        );
      },
    },
    dialogId: {
      label: "Dialog",
      type: "custom",
      render: ({ id, value, field, onChange }) => {
        return (
          <div>
            <FieldLabel field={field} />
            <CustomFreezedAutoComplete
              placeholder="Select Single Dialog"
              getItemUrl="admin/dialogs"
              getItemsUrl="admin/dialogs"
              defaultItemId={value}
              onChange={onChange}
              value={value}
            />
          </div>
        );
      },
    },
    href: { label: "Link", type: "text" },
    target: {
      label: "Target",
      type: "radio",
      options: [
        { label: "_self", value: "_self" },
        { label: "_blank", value: "_blank" },
      ],
    },
    variant: {
      label: "Variant",
      type: "radio",
      options: [
        { label: "Filled", value: "contained" },
        { label: "Outlined", value: "outlined" },
      ],
    },
    color: {
      label: "Color",
      type: "radio",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        // { label: "White", value: "white" },
      ],
    },
    size: {
      label: "Size",
      type: "radio",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "default" },
        { label: "Large", value: "lg" },
      ],
    },
    align: {
      label: "Alignment",
      type: "radio",
      options: [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
      ],
    },
  },
  defaultProps: {
    label: "زر",
    href: "#",
    variant: "contained",
    color: "primary",
    size: "default",
    action: "link",
    actionLink: "page",
    target: "_self",
    align: "start",
  },
  resolveFields: (data, { fields }) => {
    let newFields = { ...fields };
    console.log(data, "data");
    if (data.props.action === "link") {
      newFields = { ...newFields, dialogId: undefined };
      if (data.props.actionLink !== "page") {
        newFields = { ...newFields, pageId: undefined };
      }
      if (data.props.actionLink !== "car") {
        newFields = { ...newFields, carId: undefined };
      }
      if (data.props.actionLink !== "brand") {
        newFields = { ...newFields, brandId: undefined };
      }
      if (data.props.actionLink !== "offer") {
        newFields = { ...newFields, offerId: undefined };
      }
      if (data.props.actionLink !== "custom") {
        newFields = { ...newFields, href: undefined };
      }
    }
    if (data.props.action === "openDialog") {
      newFields = {
        ...newFields,
        target: undefined,
        actionLink: undefined,
        pageId: undefined,
        carId: undefined,
        brandId: undefined,
        offerId: undefined,
        href: undefined,
      };
    }
    return newFields;
  },
  render: ({ href, id, label, variant, color, size, align, puck }) => {
    return (
      <Section>
        <div
          className="w-full flex"
          style={{
            justifyContent:
              align === "center"
                ? "center"
                : align === "start"
                  ? "flex-start"
                  : "flex-end",
          }}
        >
          <button
            // href={href}
            // variant={variant}
            // size="large"
            // tabIndex={puck.isEditing ? -1 : undefined}
            className={clsx(
              getClassName(),
              getClassName({
                [`${color}-${variant}`]: true,
              }),
              getClassName({
                [size]: true,
              })
            )}
          >
            {label}
          </button>
        </div>
      </Section>
    );
  },
};
