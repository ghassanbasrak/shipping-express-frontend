import { ComponentConfig } from "@measured/puck";
import { Box } from "@mui/material";
import CustomFreezedAutoComplete from "app/shared-components/custom-freezed-auto-complete/CustomFreezedAutoComplete";
import Icon from "app/shared-components/Icon";
import clsx from "clsx";
import localeString from "src/app/main/utils/localeString";
import { Section } from "../../components/Section";
type FormProps = {
  type?:
    | "specific"
    | "carIndividualBuy"
    | "carCompanyBuy"
    | "offerBuy"
    | "serviceBuy"
    | "carSearch"
    | "drivingExperience"
    | "employment"
    | "contactUs";
  defaultCarId?: string;
  defaultServiceId?: string;
  defaultOfferId?: string;
  formId?: string;
  viewType?: "grid" | "flex";
};
function getCarName(car) {
  if (!car) {
    return "";
  }
  return `${localeString(car.brand?.name ?? car.brand?.title)} ${localeString(car.model?.name ?? car.model?.title)} ${localeString(car.subModel?.name ?? car.subModel?.title)} ${car.year ?? ""}`;
}
export const Form: ComponentConfig<FormProps> = {
  label: "Form",
  fields: {
    type: {
      label: "Type",
      type: "radio",
      options: [
        { label: "Specific Form", value: "specific" },
        { label: "Car Individual Buy", value: "carIndividualBuy" },
        { label: "Car Company Buy", value: "carCompanyBuy" },
        { label: "Offer Buy", value: "offerBuy" },
        { label: "Service Buy", value: "serviceBuy" },
        { label: "Car Search", value: "carSearch" },
        { label: "Driving Experience", value: "drivingExperience" },
        { label: "Employment", value: "employment" },
        { label: "Contact Us", value: "contactUs" },
      ],
    },

    defaultServiceId: {
      label: "Default Selected Service",
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
              placeholder="Select Single Service"
              getItemUrl="admin/services"
              getItemsUrl="admin/services"
              defaultItemId={value}
              onChange={onChange}
              value={value}
            />
          </div>
        );
      },
    },
    defaultOfferId: {
      label: "Default Selected Offer",
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
              placeholder="Select Single Offer"
              getItemUrl="admin/offers"
              getItemsUrl="admin/offers"
              defaultItemId={value}
              onChange={onChange}
              value={value}
            />
          </div>
        );
      },
    },
    defaultCarId: {
      label: "Default Selected Car",
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
              placeholder="Select Single Car"
              getItemUrl="admin/models/Car"
              getItemsUrl="admin/models/Car"
              defaultItemId={value}
              onChange={onChange}
              value={value}
              getOptionLabel={getCarName}
            />
          </div>
        );
      },
    },
    formId: {
      label: "Form",
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
              placeholder="Select Single Form"
              getItemUrl="admin/forms"
              getItemsUrl="admin/forms"
              defaultItemId={value}
              onChange={onChange}
              value={value}
              getOptionLabel={(option) =>
                option ? localeString(option.label) : ""
              }
            />
          </div>
        );
      },
    },
    viewType: {
      label: "Fields View Type",
      type: "radio",
      options: [
        { label: "Grid", value: "grid" },
        { label: "Column", value: "flex" },
      ],
    },
  },
  resolveFields: (data, { fields }) => {
    let newFields = { ...fields };
    if (data.props.type !== "specific") {
      newFields = { ...newFields, formId: undefined };
    }
    if (
      data.props.type !== "carIndividualBuy" &&
      data.props.type !== "carCompanyBuy" &&
      data.props.type !== "drivingExperience"
    ) {
      newFields = { ...newFields, defaultCarId: undefined };
    }
    if (data.props.type !== "offerBuy") {
      newFields = { ...newFields, defaultOfferId: undefined };
    }
    if (data.props.type !== "serviceBuy") {
      newFields = { ...newFields, defaultServiceId: undefined };
    }
    return newFields;
  },
  defaultProps: { type: "specific", viewType: "grid" },
  render: ({ id, type, viewType, puck }) => {
    return (
      <Section>
        <div
          className={clsx(
            "flex items-center justify-center min-w-512 p-16",
            viewType === "grid" ? "h-256" : "h-512"
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
              <Icon type="fa6" name="FaWpforms" size="2em" />
              <div className="text-3xl font-semibold">استمارة</div>
            </div>
            <div className="text-18 font-semibold text-gray-400">
              {viewType === "grid"
                ? "إذا كان هناك عنوان ووصف للاستمارة فسيظهر والحقول ستنعرض كعناصر شبكية"
                : "إذا كان هناك عنوان ووصف للاستمارة فسيظهر والحقول ستنعرض كعناصر داخل عمود"}
            </div>
          </Box>
        </div>
      </Section>
    );
  },
};
