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

export const generateDefaultBuilderConfig = (
  header?: ReactNode,
  footer?: ReactNode,
  language?: string
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
      fields: {
        paddingTop: {
          label: "Padding Top",
          type: "text",
        },
        paddingBottom: {
          label: "Padding Bottom",
          type: "text",
        },
      },
      defaultProps: {
        paddingTop: "2.75rem",
        paddingBottom: "2.75rem",
      },
      render: ({ puck, children, paddingTop, paddingBottom }) => (
        <Root
          children={children}
          header={header}
          footer={footer}
          language={language}
          paddingTop={paddingTop}
          paddingBottom={paddingBottom}
          puck={puck}
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

export interface WebsiteBuilderProps {
  title?: string;
  config?: Config;
  initialData?: Data;
  onSave: (data: Data) => void;
  loadingSave?: boolean;
  onExit?: () => void;
  header?: ReactNode;
  footer?: ReactNode;
}
export interface WebsiteBuilderPreviewProps {
  title?: string;
  config?: Config;
  data: Data;
  header?: ReactNode;
  footer?: ReactNode;
}
