import { ComponentConfig } from "@measured/puck";
import { Section } from "../../components/Section";

export type HeadingProps = {
  text?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  weight?: "light" | "medium" | "bold";
  color:
    | "white"
    | "default"
    | "primary"
    | "secondary"
    | "disabled"
    | "success"
    | "error"
    | "warning";
  align: "start" | "center" | "end";
  verticalPadding?: string;
  horizontalPadding?: string;
};

export const Heading: ComponentConfig<HeadingProps> = {
  fields: {
    text: { type: "text", label: "Heading" },
    level: {
      label: "Level",
      type: "select",
      options: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" },
        { label: "5", value: "5" },
        { label: "6", value: "6" },
      ],
    },
    weight: {
      label: "Weight",
      type: "radio",
      options: [
        { label: "Light", value: "light" },
        { label: "Medium", value: "medium" },
        { label: "Bold", value: "bold" },
      ],
    },
    color: {
      label: "Color",
      type: "radio",
      options: [
        { label: "Default", value: "default" },
        { label: "White", value: "white" },
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Disabled", value: "disabled" },
        { label: "Error", value: "error" },
        { label: "Warning", value: "warning" },
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
    verticalPadding: { label: "Vertical Padding", type: "text" },
    horizontalPadding: { label: "Horizontal Padding", type: "text" },
  },
  defaultProps: {
    align: "start",
    text: "عنوان",
    verticalPadding: "10px",
    horizontalPadding: "10px",
    weight: "bold",
    color: "primary",
    level: 1,
  },
  render: ({
    align,
    text,
    level,
    verticalPadding,
    horizontalPadding,
    color,
    weight,
  }) => {
    const Tag: any = `h${level ?? 1}`;
    return (
      <Section>
        <Tag
          style={{
            paddingLeft: horizontalPadding,
            paddingRight: horizontalPadding,
            paddingTop: verticalPadding,
            paddingBottom: verticalPadding,
            color:
              color === "primary"
                ? "#BA2025"
                : color === "secondary"
                  ? "#E8B92C"
                  : color === "success"
                    ? "green"
                    : color === "error"
                      ? "#f44336"
                      : color === "warning"
                        ? "#ed813e"
                        : color === "disabled"
                          ? "rgb(149, 156, 169"
                          : color === "white"
                            ? "white"
                            : "black",

            display: "flex",
            textAlign: align,
            width: "100%",
            fontWeight:
              weight === "light" ? "300" : weight === "medium" ? "500" : "700",
            justifyContent:
              align === "center"
                ? "center"
                : align === "start"
                  ? "flex-start"
                  : "flex-end",
          }}
        >
          {text}
        </Tag>
      </Section>
    );
  },
};
