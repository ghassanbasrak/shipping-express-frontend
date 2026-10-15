import { ComponentConfig, DropZone } from "@measured/puck";
import { Section } from "../../components/Section";
import clsx from "clsx";

export type GridProps = {
  items: {
    colSpan?: number;
  }[];
  columns?:
    | "grid-cols-1"
    | "grid-cols-2"
    | "grid-cols-3"
    | "grid-cols-4"
    | "grid-cols-5"
    | "grid-cols-6";
  smColumns?:
    | "sm:grid-cols-1"
    | "sm:grid-cols-2"
    | "sm:grid-cols-3"
    | "sm:grid-cols-4"
    | "sm:grid-cols-5"
    | "sm:grid-cols-6";
  mdColumns?:
    | "md:grid-cols-1"
    | "md:grid-cols-2"
    | "md:grid-cols-3"
    | "md:grid-cols-4"
    | "md:grid-cols-5"
    | "md:grid-cols-6";
  lgColumns?:
    | "lg:grid-cols-1"
    | "lg:grid-cols-2"
    | "lg:grid-cols-3"
    | "lg:grid-cols-4"
    | "lg:grid-cols-5"
    | "lg:grid-cols-6";
  gap?: string;
};

export const Grid: ComponentConfig<GridProps> = {
  fields: {
    columns: {
      label: "Columns Count",
      type: "radio",
      options: [
        { label: "1", value: "grid-cols-1" },
        { label: "2", value: "grid-cols-2" },
        { label: "3", value: "grid-cols-3" },
        { label: "4", value: "grid-cols-4" },
        { label: "5", value: "grid-cols-5" },
        { label: "6", value: "grid-cols-6" },
      ],
    },
    smColumns: {
      label: "Columns Count (Small Screens)",
      type: "radio",
      options: [
        { label: "1", value: "sm:grid-cols-1" },
        { label: "2", value: "sm:grid-cols-2" },
        { label: "3", value: "sm:grid-cols-3" },
        { label: "4", value: "sm:grid-cols-4" },
        { label: "5", value: "sm:grid-cols-5" },
        { label: "6", value: "sm:grid-cols-6" },
      ],
    },
    mdColumns: {
      label: "Columns Count (Medium Screens)",
      type: "radio",
      options: [
        { label: "1", value: "md:grid-cols-1" },
        { label: "2", value: "md:grid-cols-2" },
        { label: "3", value: "md:grid-cols-3" },
        { label: "4", value: "md:grid-cols-4" },
        { label: "5", value: "md:grid-cols-5" },
        { label: "6", value: "md:grid-cols-6" },
      ],
    },
    lgColumns: {
      label: "Columns Count (Large Screens)",
      type: "radio",
      options: [
        { label: "1", value: "lg:grid-cols-1" },
        { label: "2", value: "lg:grid-cols-2" },
        { label: "3", value: "lg:grid-cols-3" },
        { label: "4", value: "lg:grid-cols-4" },
        { label: "5", value: "lg:grid-cols-5" },
        { label: "6", value: "lg:grid-cols-6" },
      ],
    },
    gap: {
      label: "Gap",
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
    items: {
      label: "Items",
      type: "array",

      getItemSummary: (col, id) => `Item ${id + 1}`,
      arrayFields: {
        colSpan: {
          label: "Column Span",
          type: "number",
          min: 1,
        },
      },
    },
  },
  defaultProps: {
    gap: "8px",
    columns: "grid-cols-1",
    smColumns: "sm:grid-cols-2",
    mdColumns: "md:grid-cols-3",
    lgColumns: "lg:grid-cols-3",
    items: [
      {
        colSpan: 1,
      },
      {
        colSpan: 1,
      },
      {
        colSpan: 1,
      },
    ],
  },
  render: ({ items, gap, columns, smColumns, mdColumns, lgColumns, puck }) => {
    return (
      <Section>
        <div
          className={clsx(
            "grid grid-cols w-full",
            columns,
            smColumns,
            mdColumns,
            lgColumns
          )}
          style={{
            gap,
          }}
        >
          {items.map(({ colSpan }, idx) => (
            <div
              key={idx}
              style={{
                gridColumn: `span ${colSpan ?? 1} / span ${colSpan ?? 1}`,
                width: "100%",
              }}
            >
              <DropZone
                zone={`row-${idx}`}
                disallow={["Hero", "Logos", "Stats"]}
              />
            </div>
          ))}
        </div>
      </Section>
    );
  },
};
