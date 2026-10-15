import {
  ComponentConfig,
  Config,
  Data,
  DefaultRootProps,
} from "@measured/puck";
import { Card } from "./config/blocks/Card";
import { Heading } from "./config/blocks/Heading";
import { Flex } from "./config/blocks/Flex";
import { Text } from "./config/blocks/Text";
import { VerticalSpace } from "./config/blocks/VerticalSpace";
import { Button } from "./config/blocks/Button";
import { Slider } from "./config/blocks/Slider";
import { Cars } from "./config/blocks/Cars";
import { Brands } from "./config/blocks/Brands";
import { Partners } from "./config/blocks/Partners";
import { Banks } from "./config/blocks/Banks";
import { Form } from "./config/blocks/Form";
import { Column } from "./config/blocks/Column";
import { Row } from "./config/blocks/Row";
import { Grid } from "./config/blocks/Grid";
import { Image } from "./config/blocks/Image";
import { Logo } from "./config/blocks/Logo";
import { Video } from "./config/blocks/Video";
import Root from "./config/root";
import { ReactNode } from "react";
import FreezedMediaInput from "../media-input/FreezedMediaInput";

export const generateDefaultBuilderConfig = (
  language?: string,
  title?: string,
  closeIcon?: boolean
) => {
  const components = {
    Button,
    Card,
    Heading,
    Flex,
    Text,
    VerticalSpace,
    Slider,
    Cars,
    Brands,
    Partners,
    Banks,
    Form,
    Row,
    Column,
    Grid,
    Image,
    Logo,
    Video,
  };
  const defaultConfig: Config = {
    root: {
      label: "Dialog",
      fields: {
        paddingTop: {
          label: "Padding Top",
          type: "text",
        },
        paddingBottom: {
          label: "Padding Bottom",
          type: "text",
        },
        borderRadius: {
          label: "Border Radius",
          type: "text",
        },
        headerType: {
          label: "Header",
          type: "select",
          options: [
            { label: "Text & Border", value: "textWithBorder" },
            { label: "Only Text", value: "text" },
            { label: "Hidden", value: "hidden" },
          ],
        },
        backgroundColor: {
          label: "Background Color",
          type: "text",
        },
        backgroundImageUrl: {
          label: "Background Image Url",
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
        backgroundSize: {
          label: "Background Size",
          type: "select",
          options: [
            { label: "Cover", value: "cover" },
            { label: "Contain", value: "contain" },
            { label: "Auto", value: "auto" },
          ],
        },
      },
      defaultProps: {
        headerType: "textWithBorder",
        backgroundColor: "white",
        paddingTop: "2rem",
        paddingBottom: "2rem",
        backgroundSize: "cover",
        borderRadius: "20px",
      },
      render: ({
        puck,
        children,
        paddingTop,
        paddingBottom,
        headerType,
        backgroundColor,
        backgroundImageUrl,
        backgroundSize,
        borderRadius,
      }) => (
        <Root
          children={children}
          language={language}
          paddingTop={paddingTop}
          paddingBottom={paddingBottom}
          title={title}
          closeIcon={closeIcon}
          puck={puck}
          headerType={headerType}
          backgroundColor={backgroundColor}
          backgroundImageUrl={backgroundImageUrl}
          backgroundSize={backgroundSize}
          borderRadius={borderRadius}
        />
      ),
    },
    categories: {
      layout: {
        components: ["Flex", "Row", "Column", "Grid", "Card", "VerticalSpace"],
      },
      typography: {
        components: ["Heading", "Text"],
      },
      interactive: {
        title: "Actions",
        components: ["Button"],
      },
      componenets: {
        title: "Components",
        components: ["Slider", "Form", "Cars", "Brands", "Partners", "Banks"],
      },
      media: {
        title: "Media & Other",
        components: ["Image", "Logo", "Video"],
      },
    },
    components: components as any,
  };
  // if (customComponents && customComponents.length > 0) {
  //   defaultConfig.categories;
  // }
  return defaultConfig;
};

export interface WebsiteDialogBuilderProps {
  title?: string;
  config?: Config;
  initialData?: Data;
  onSave: (data: Data) => void;
  loadingSave?: boolean;
  onExit?: () => void;
  closeIcon?: boolean;
}
export interface WebsiteDialogBuilderPreviewProps {
  title?: string;
  config?: Config;
  data: Data;
  closeIcon?: boolean;
}
