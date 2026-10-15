import { ComponentConfig } from "@measured/puck";
import { Box } from "@mui/material";
import CustomFreezedAutoComplete from "app/shared-components/custom-freezed-auto-complete/CustomFreezedAutoComplete";
import Icon from "app/shared-components/Icon";
import { Section } from "../../components/Section";
type SliderProps = {
  width?: "fullScreen" | "asLayout";
  sliderId?: string;
};
export const Slider: ComponentConfig<SliderProps> = {
  label: "Slider",
  fields: {
    width: {
      label: "Width",
      type: "radio",
      options: [
        { label: "Full Screen", value: "fullScreen" },
        { label: "As Layout", value: "asLayout" },
      ],
    },
    sliderId: {
      label: "Slider",
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
              placeholder="Select Single Slider"
              getItemUrl="admin/sliders"
              getItemsUrl="admin/sliders"
              // defaultItems={[]}
              defaultItemId={value}
              onChange={onChange}
              value={value}
            />
          </div>
        );
      },
    },
  },
  defaultProps: { width: "fullScreen" },
  render: ({ id, width, puck }) => {
    const slider = (
      <div className="flex items-center justify-center h-400 p-16 bg-grey-300">
        <Box
          component="div"
          className="flex flex-col items-center justify-center space-y-16 w-full h-full border-2 border-dashed rounded-lg"
          sx={{
            color: (theme) => theme.palette.info.main,
            borderColor: (theme) => theme.palette.info.main,
          }}
        >
          <div className="flex items-center space-x-8">
            <Icon type="fa6" name="FaImages" size="2em" />
            <div className="text-3xl font-semibold">السلايدر</div>
          </div>
        </Box>
      </div>
    );
    return width === "fullScreen" ? slider : <Section>{slider}</Section>;
  },
};
