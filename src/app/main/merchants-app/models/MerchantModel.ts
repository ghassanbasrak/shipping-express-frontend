import _ from "@lodash";
import IMerchant from "./IMerchant";
export const defaultMerchantCountry =
  import.meta.env.VITE_DEFAULT_COUNTRY_ID || "65fd1a1c1fdbc094e3369b29";
const MerchantModel = (value: Partial<IMerchant> = {}): IMerchant =>
  _.defaultsDeep({}, value, {
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phone1: "",
    companyName: "",
    taxNumber: "",
    loyaltyType: "custom",
    prices: [],
    address: {
      countryId: defaultMerchantCountry,
      stateId: "",
      cityId: "",
      street: "",
      zipCode: "",
    },
  });
export const merchantDefaultValues = MerchantModel();
export const merchantEditableFields = [
  "firstName",
  "lastName",
  "companyName",
  "email",
  "phone",
  "phone1",
  "address",
  "taxNumber",
  "loyaltyType",
  "prices",
];
export default MerchantModel;
