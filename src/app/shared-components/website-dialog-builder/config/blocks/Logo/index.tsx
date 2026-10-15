import { ComponentConfig } from "@measured/puck";
import { Section } from "../../components/Section";
type LogoProps = {
  variant: "logoWithText" | "logo" | "text";
  color?: "colored" | "white";
  action?: "active" | "inactive";
};
export const Logo: ComponentConfig<LogoProps> = {
  label: "Logo",
  fields: {
    variant: {
      label: "Variant",
      type: "radio",
      options: [
        { label: "Logo With Text", value: "logoWithText" },
        { label: "Logo Only", value: "logo" },
        { label: "Text Only", value: "text" },
      ],
    },
    color: {
      label: "Color",
      type: "radio",
      options: [
        { label: "Colorfull", value: "colored" },
        { label: "White", value: "white" },
      ],
    },
    action: {
      label: "Click Event",
      type: "radio",
      options: [
        { label: "Inactive", value: "inactive" },
        { label: "Open Home Page", value: "active" },
      ],
    },
  },

  defaultProps: {
    variant: "logoWithText",
    color: "colored",
    action: "inactive",
  },
  render: ({ id, variant, color, action, puck }) => {
    const image = (
      <img
        src={`assets/images/logo/${variant === "text" ? (color === "colored" ? "logo-text-only.png" : "logo-text-only-dark.png") : variant === "logo" ? (color === "colored" ? "logo.png" : "logo-dark.png") : color === "colored" ? "logo-text.png" : "logo-text-dark.png"}`}
        style={{
          cursor: action === "active" ? "pointer" : "default",
        }}
        alt="Logo"
      />
    );
    return (
      <Section>
        {action === "active" ? <a href={"/"}>{image}</a> : image}
      </Section>
    );
  },
};
