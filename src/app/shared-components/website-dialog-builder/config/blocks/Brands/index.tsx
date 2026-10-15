import { ComponentConfig } from "@measured/puck";
import { Box } from "@mui/material";
import CustomFreezedAutoComplete from "app/shared-components/custom-freezed-auto-complete/CustomFreezedAutoComplete";
import Icon from "app/shared-components/Icon";
import clsx from "clsx";
import { Section } from "../../components/Section";
type BrandsProps = {
  type?: "all" | "specific";
  brandIds?: string[];
  viewType?: "slider" | "grid";
};

export const Brands: ComponentConfig<BrandsProps> = {
  label: "Brands",
  fields: {
    type: {
      label: "Type",
      type: "radio",
      options: [
        { label: "All Brands", value: "all" },
        { label: "Specific Brands", value: "specific" },
      ],
    },

    brandIds: {
      label: "Specific Brands",
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
            <CustomFreezedAutoComplete
              placeholder="Select Multiple Brands"
              multiple
              getItemUrl="admin/models/Brand"
              getItemsUrl="admin/models/Brand"
              // defaultItems={[]}
              defaultItemIds={value}
              onChange={onChange}
              value={value}
            />
          </div>
        );
      },
    },
    viewType: {
      label: "View Type",
      type: "radio",
      options: [
        { label: "Slider", value: "slider" },
        { label: "Grid", value: "grid" },
      ],
    },
  },
  resolveFields: (data, { fields }) => {
    let newFields = { ...fields };
    if (data.props.type !== "specific") {
      newFields = { ...newFields, brandIds: undefined };
    }
    return newFields;
  },
  defaultProps: { type: "all", viewType: "slider", brandIds: [] },
  render: ({ id, type, brandIds, viewType, puck }) => {
    return (
      <Section>
        <div
          className={clsx(
            "flex items-center justify-center min-w-512 p-16",
            viewType === "slider" ? "h-128" : "h-512"
          )}
        >
          <Box
            component="div"
            className="flex flex-col items-center justify-center space-y-16 w-full h-full border-2 border-dashed rounded-lg"
            sx={{
              color: (theme) => theme.palette.info.main,
              borderColor: (theme) => theme.palette.info.main,
            }}
          >
            <div className="flex items-center space-x-8">
              <Icon type="fa6" name="FaCarTunnel" size="2em" />
              <div className="text-3xl font-semibold">العلامات التجارية</div>
            </div>
            <div className="text-18 font-semibold text-gray-400">
              {viewType === "slider"
                ? "العلامات التجارية ستظهر هنا داخل القسم كسلايدر"
                : "العلامات التجارية ستظهر هنا داخل القسم كعناصر داخل شبكة"}
            </div>
          </Box>
        </div>
      </Section>
    );
  },
};
