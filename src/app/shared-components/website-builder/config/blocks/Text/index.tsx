import { ComponentConfig } from "@measured/puck";
import { Section } from "../../components/Section";
import styles from "./styles.module.css";
import getClassNameFactory from "../../getClassNameFactory";
import clsx from "clsx";

const getClassName = getClassNameFactory("Text", styles);

export type TextProps = {
  text?: string;
  size?: "xxxxl" | "xxxl" | "xxl" | "xl" | "l" | "m" | "s" | "xs";
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

export const Text: ComponentConfig<TextProps> = {
  fields: {
    text: { type: "textarea", label: "Text" },
    size: {
      label: "Size",
      type: "select",
      options: [
        { value: "xxxl", label: "XXXL" },
        { value: "xxl", label: "XXL" },
        { value: "xl", label: "XL" },
        { value: "l", label: "L" },
        { value: "m", label: "M" },
        { value: "s", label: "S" },
        { value: "xs", label: "XS" },
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
        { label: "Success", value: "success" },
        { label: "Error", value: "error" },
        { label: "Warning", value: "warning" },
        { label: "Disabled", value: "disabled" },
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
    verticalPadding: { type: "text", label: "Vertical Padding" },
    horizontalPadding: { type: "text", label: "Horizontal Padding" },
  },
  defaultProps: {
    align: "start",
    weight: "medium",
    text: "نص",
    verticalPadding: "10px",
    horizontalPadding: "10px",
    size: "m",
    color: "default",
  },
  render: ({
    align,
    color,
    text,
    size,
    verticalPadding,
    horizontalPadding,
    weight,
  }) => {
    return (
      <Section>
        <span
          className={clsx(
            "whitespace-pre-wrap",
            getClassName({
              [size]: true,
            })
          )}
          style={{
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
            paddingLeft: horizontalPadding,
            paddingRight: horizontalPadding,
            paddingTop: verticalPadding,
            paddingBottom: verticalPadding,
          }}
        >
          {text}
        </span>
      </Section>
    );
  },
};
