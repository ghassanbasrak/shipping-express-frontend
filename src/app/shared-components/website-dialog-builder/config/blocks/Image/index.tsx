import { ComponentConfig } from "@measured/puck";
import { Box } from "@mui/material";
import CustomFreezedAutoComplete from "app/shared-components/custom-freezed-auto-complete/CustomFreezedAutoComplete";
import Icon from "app/shared-components/Icon";
import FreezedMediaInput from "app/shared-components/media-input/FreezedMediaInput";
import { Section } from "../../components/Section";
type ImageProps = {
  widthType: "fullScreen" | "asLayout" | "auto" | "custom";
  width?: number;
  heightType: "auto" | "custom";
  height?: number;
  borderRadius?: number;
  imageUrl: string;
  alt?: string;
  resolution?: "normal" | "high";
  action?: "active" | "inactive";
  href?: string;
  target?: "_self" | "_blank";
};
export const Image: ComponentConfig<ImageProps> = {
  label: "Image",
  fields: {
    widthType: {
      label: "Width",
      type: "radio",
      options: [
        { label: "Full Screen", value: "fullScreen" },
        { label: "As Layout", value: "asLayout" },
        { label: "Auto", value: "auto" },
        { label: "Custom", value: "custom" },
      ],
    },
    width: { type: "number", label: "Width (px)", min: 5 },
    heightType: {
      label: "Height",
      type: "radio",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Custom", value: "custom" },
      ],
    },
    height: { type: "number", label: "Height (px)", min: 5 },
    borderRadius: { type: "number", label: "Border Radius (px)", min: 0 },
    imageUrl: {
      label: "Image",
      type: "custom",
      render: ({ id, value, field, onChange }) => {
        return (
          <div>
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
            <FreezedMediaInput
              onChange={onChange}
              value={value}
              label="Image"
              imageUrl={value}
            />
          </div>
        );
      },
    },
    alt: { type: "text", label: "Alternative" },
    resolution: {
      label: "Resolution",
      type: "radio",
      options: [
        { label: "Normal", value: "normal" },
        { label: "High", value: "high" },
      ],
    },
    action: {
      label: "Click Event",
      type: "radio",
      options: [
        { label: "Inactive", value: "inactive" },
        { label: "Open Page", value: "active" },
      ],
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
  },

  defaultProps: {
    widthType: "asLayout",
    width: 150,
    heightType: "auto",
    height: 150,
    borderRadius: 4,
    resolution: "high",
    imageUrl: "",
    action: "inactive",
    href: "#",
    target: "_blank",
  },
  resolveFields: (data, { fields }) => {
    let newFields = { ...fields };
    if (data.props.widthType !== "custom") {
      newFields = { ...newFields, width: undefined };
    }
    if (data.props.heightType !== "custom") {
      newFields = { ...newFields, height: undefined };
    }
    if (data.props.action !== "inactive") {
      newFields = { ...newFields, href: undefined, target: undefined };
    }
    return newFields;
  },
  render: ({
    id,
    imageUrl,
    widthType,
    height,
    width,
    heightType,
    borderRadius,
    resolution,
    action,
    href,
    target,
    alt,
    puck,
  }) => {
    let image = imageUrl ? (
      <img
        src={imageUrl}
        style={{
          width:
            widthType === "fullScreen" || widthType === "asLayout"
              ? "100%"
              : widthType === "custom"
                ? `${width}px`
                : "auto",
          height: heightType === "custom" ? `${height}px` : "auto",
          borderRadius: borderRadius ? `${borderRadius}px` : undefined,
          cursor: action === "active" ? "pointer" : "default",
        }}
        alt={alt}
      />
    ) : undefined;
    image = imageUrl ? (
      action === "active" ? (
        <a href={href} target={target}>
          {image}
        </a>
      ) : (
        image
      )
    ) : (
      <div
        className="flex items-center justify-center h-400 p-16 bg-grey-300"
        style={{
          width: widthType === "fullScreen" ? "1280px" : "auto",
          marginRight: widthType === "fullScreen" ? "-85px" : "auto",
          marginLeft: widthType === "fullScreen" ? "-85px" : "auto",
        }}
      >
        <Box
          component="div"
          className="flex flex-col items-center justify-center space-y-16 w-full h-full border-2 border-dashed rounded-lg"
          sx={{
            color: (theme) => theme.palette.primary.main,
            borderColor: (theme) => theme.palette.primary.main,
          }}
        >
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-semibold">لا يوجد صورة بعد</div>
          </div>
        </Box>
      </div>
    );
    return widthType === "fullScreen" ? image : <Section>{image}</Section>;
  },
};
