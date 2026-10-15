import { ComponentConfig, DropZone } from "@measured/puck";
import { Section } from "../../components/Section";

export type RowProps = {
  justifyContent:
    | "normal"
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around";
  alignItems: "flex-start" | "center" | "flex-end";
  items: {
    verticalAlign?: "inherit" | "start" | "center" | "end";
    horizontalAlign?: "inherit" | "start" | "center" | "end";
  }[];
  spaceBetween?: string;
  distribution: "auto" | "manual";
};

export const Row: ComponentConfig<RowProps> = {
  fields: {
    justifyContent: {
      label: "Justify Content",
      type: "radio",
      options: [
        { label: "Normal", value: "normal" },
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Space Between", value: "space-between" },
        { label: "Space Around", value: "space-around" },
      ],
    },
    alignItems: {
      label: "Align Items",
      type: "radio",
      options: [
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
      ],
    },
    spaceBetween: {
      label: "Space Between",
      type: "radio",
      options: [
        { label: "None", value: "0px" },
        { label: "2", value: "2px" },
        { label: "4", value: "4px" },
        { label: "8", value: "8px" },
        { label: "16", value: "16px" },
        { label: "32", value: "32px" },
      ],
    },
    distribution: {
      label: "Distibution",
      type: "radio",
      options: [
        {
          value: "auto",
          label: "Auto",
        },
        {
          value: "manual",
          label: "Manual",
        },
      ],
    },
    items: {
      label: "Items",
      type: "array",

      getItemSummary: (col, id) => `Column ${id + 1}`,
      arrayFields: {
        verticalAlign: {
          label: "Vertical Align",
          type: "select",
          options: [
            { label: "Auto", value: "inherit" },
            { label: "Top", value: "start" },
            { label: "Center", value: "center" },
            { label: "Bottom", value: "end" },
          ],
        },
        horizontalAlign: {
          label: "Horizontal Align",
          type: "select",
          options: [
            { label: "Auto", value: "inherit" },
            { label: "Start", value: "start" },
            { label: "Center", value: "center" },
            { label: "End", value: "end" },
          ],
        },
      },
    },
  },
  defaultProps: {
    justifyContent: "normal",
    alignItems: "flex-start",
    spaceBetween: "4px",
    distribution: "auto",
    items: [
      {
        verticalAlign: "inherit",
        horizontalAlign: "inherit",
      },
      // {
      //   verticalAlign: "inherit",
      //   horizontalAlign: "inherit",
      // },
    ],
  },
  render: ({
    items,
    justifyContent,
    alignItems,
    spaceBetween,
    distribution,
    puck,
  }) => {
    return (
      <Section>
        <div
          className="flex"
          style={{
            justifyContent,
            alignItems,
            gap: spaceBetween,
          }}
        >
          {items.map(({ verticalAlign, horizontalAlign }, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: verticalAlign,
                justifySelf: horizontalAlign,
              }}
              className={distribution === "auto" ? "w-full" : ""}
            >
              <DropZone
                zone={`column-${idx}`}
                style={{
                  minWidth: "150px",
                  minHeight: "100px",
                }}
              />
            </div>
          ))}
        </div>
      </Section>
    );
  },
};
