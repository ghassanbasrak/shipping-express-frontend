import { ComponentConfig, DropZone } from "@measured/puck";
import { Section } from "../../components/Section";

export type CardProps = {
  backgroundColor:
    | "default"
    | "primary"
    | "secondary"
    | "disabled"
    | "success"
    | "error"
    | "warning"
    | "custom";
  customBackgroundColor?: string;
  shadow: "none" | "sm" | "md" | "lg";
  borderRadius: "none" | "sm" | "md" | "lg" | "circle";
  padding?: string;
};

export const Card: ComponentConfig<CardProps> = {
  fields: {
    backgroundColor: {
      label: "Color",
      type: "radio",
      options: [
        { label: "Default", value: "default" },
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Success", value: "success" },
        { label: "Error", value: "error" },
        { label: "Warning", value: "warning" },
        { label: "Disabled", value: "disabled" },
        { label: "Custom", value: "custom" },
      ],
    },
    customBackgroundColor: {
      label: "Custom Color (HEX Code)",
      type: "text",
    },
    shadow: {
      label: "Shadow",
      type: "radio",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    borderRadius: {
      label: "Border Radius",
      type: "radio",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Circle", value: "circle" },
      ],
    },
    padding: {
      label: "Padding",
      type: "text",
    },
  },
  defaultProps: {
    backgroundColor: "default",
    customBackgroundColor: "",
    shadow: "sm",
    borderRadius: "md",
    padding: "0.75rem",
  },
  resolveFields: (data, { fields }) => {
    let newFields = { ...fields };
    if (data.props.backgroundColor !== "custom") {
      newFields = { ...newFields, customBackgroundColor: undefined };
    }
    return newFields;
  },
  render: ({
    backgroundColor,
    customBackgroundColor,
    shadow,
    borderRadius,
    padding,
    puck,
  }) => {
    return (
      <Section>
        <div
          className="w-full"
          style={{
            boxShadow:
              shadow === "sm"
                ? "0 1px 2px 0 rgb(0 0 0 / 0.05)"
                : shadow === "md"
                  ? "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                  : shadow === "lg"
                    ? "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
                    : "none",
            borderRadius:
              borderRadius === "circle"
                ? "9999px"
                : borderRadius === "sm"
                  ? "0.125rem"
                  : borderRadius === "md"
                    ? "0.375rem"
                    : borderRadius === "lg"
                      ? "0.5rem"
                      : undefined,
            backgroundColor:
              backgroundColor === "primary"
                ? "#BA2025"
                : backgroundColor === "secondary"
                  ? "#E8B92C"
                  : backgroundColor === "success"
                    ? "green"
                    : backgroundColor === "error"
                      ? "#f44336"
                      : backgroundColor === "warning"
                        ? "#ed813e"
                        : backgroundColor === "disabled"
                          ? "rgb(149, 156, 169"
                          : backgroundColor === "custom"
                            ? customBackgroundColor
                            : "white",
            padding,
          }}
        >
          <DropZone zone={`card`} />
        </div>
      </Section>
    );
  },
};
