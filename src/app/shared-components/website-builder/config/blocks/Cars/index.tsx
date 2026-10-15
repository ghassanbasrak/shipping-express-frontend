import { ComponentConfig } from "@measured/puck";
import CustomFreezedAutoComplete from "app/shared-components/custom-freezed-auto-complete/CustomFreezedAutoComplete";
import localeString from "src/app/main/utils/localeString";
import Icon from "app/shared-components/Icon";
import { Box } from "@mui/material";
import { Section } from "../../components/Section";
type CarsProps = {
  type?: "poppular" | "discounts" | "new" | "byBrand" | "specific";
  brandIds?: string[];
  carIds?: string[];
  pageSize?: number; // 12 by default
};
function getCarName(car) {
  if (!car) {
    return "";
  }
  return `${localeString(car.brand?.name ?? car.brand?.title)} ${localeString(car.model?.name ?? car.model?.title)} ${localeString(car.subModel?.name ?? car.subModel?.title)} ${car.year ?? ""}`;
}
export const Cars: ComponentConfig<CarsProps> = {
  label: "Cars",
  fields: {
    type: {
      label: "Type",
      type: "radio",
      options: [
        { label: "Popular", value: "poppular" },
        { label: "Discounts", value: "discounts" },
        { label: "New", value: "new" },
        { label: "By Brands", value: "byBrand" },
        { label: "Specific Cars", value: "specific" },
      ],
    },
    brandIds: {
      label: "Filter By Brands",
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
    carIds: {
      label: "Specific Cars",
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
              placeholder="Select Multiple Cars"
              multiple
              getItemUrl="admin/models/Car"
              getItemsUrl="admin/models/Car"
              // defaultItems={[]}
              defaultItemIds={value}
              onChange={onChange}
              value={value}
              getOptionLabel={getCarName}
            />
          </div>
        );
      },
    },
    pageSize: {
      label: "Page Size",
      type: "select",
      options: [
        { label: "4", value: 4 },
        { label: "8", value: 8 },
        { label: "12", value: 12 },
        { label: "16", value: 16 },
        { label: "20", value: 20 },
        { label: "24", value: 24 },
      ],
    },
  },
  resolveFields: (data, { fields }) => {
    let newFields = { ...fields };
    if (data.props.type !== "byBrand") {
      newFields = { ...newFields, brandIds: undefined };
    }
    if (data.props.type !== "specific") {
      newFields = { ...newFields, carIds: undefined };
    }
    if (data.props.type === "specific") {
      newFields = { ...newFields, pageSize: undefined };
    }
    return newFields;
  },
  defaultProps: { type: "poppular", pageSize: 12, brandIds: [] },
  render: ({ id, type, brandIds, pageSize, puck }) => {
    return (
      <Section>
        <div className="flex items-center justify-center h-512 min-w-512 p-16">
          <Box
            component="div"
            className="flex flex-col items-center justify-center space-y-16 w-full h-full border-2 border-dashed rounded-lg"
            sx={{
              color: (theme) => theme.palette.info.main,
              borderColor: (theme) => theme.palette.info.main,
            }}
          >
            <div className="flex items-center space-x-8">
              <Icon type="fa6" name="FaCarSide" size="2em" />
              <div className="text-3xl font-semibold">السيارات</div>
            </div>
            <div className="text-18 font-semibold text-gray-400">
              السيارات ستظهر هنا في هذا القسم كعناصر داخل شبكة
            </div>
          </Box>
        </div>
      </Section>
    );
  },
};
