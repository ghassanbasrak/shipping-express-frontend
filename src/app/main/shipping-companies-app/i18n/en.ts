const locale = {
  EDIT_SHIPPING_COMPANY: "Edit Shipping Company",
  SHIPPING_COMPANIES: "Shipping Companies",
  NO_SHIPPING_COMPANIES: "There are no shipping companies!",
  SEARCH_SHIPPING_COMPANIES: "Search Shipping Companies",
  NO_SUCH_SHIPPING_COMPANY: "There is no such shipping company!",
  GO_TO_SHIPPING_COMPANIES: "Go To Shipping Companies Page",
  SHIPPING_COMPANY_DETAILS: "Shipping Company Details",
  ADD_SHIPPING_COMPANY: "Add Shipping Company",
  SAVE_SHIPPING_COMPANY: "Save Shipping Company",
  REMOVE_SHIPPING_COMPANY: "Remove Shipping Company",

  SOMETHING_WENT_WRONG_WHEN_SAVE_SHIPPING_COMPANY:
    "Something went wrong while saving the shipping company!",
  SOMETHING_WENT_WRONG_WHEN_ADD_SHIPPING_COMPANY:
    "Something went wrong while adding a shipping company!",
  SOMETHING_WENT_WRONG_WHEN_REMOVE_SHIPPING_COMPANY:
    "Something went wrong while removing the shipping company!",
  SOMETHING_WENT_WRONG_WHEN_DEACTIVATE_SHIPPING_COMPANY:
    "Something went wrong while deactivating the shipping company!",
  SOMETHING_WENT_WRONG_WHEN_ACTIVATE_SHIPPING_COMPANY:
    "Something went wrong while activating the shipping company!",
  SHIPPING_COMPANY_SAVED_SUCCESSFULLY: "Shipping company saved successfully",
  SHIPPING_COMPANY_REMOVED_SUCCESSFULLY:
    "Shipping company removed successfully",
  SHIPPING_COMPANY_ACTIVATED_SUCCESSFULLY:
    "Shipping company activated successfully",
  SHIPPING_COMPANY_DEACTIVATED_SUCCESSFULLY:
    "Shipping company deactivated successfully",

  BASIC_INFO: "Basic Info",

  REQUIRED_FIELD: "Required field",
  FULL_NAME_REQUIRED: "Full name is required",
  TWO_CHARACTERS_AT_LEAST: "You must enter 2 characters at least",
  SHIPPING_COMPANY: "Shipping Company",
  RECEIVER: "Receiver",
  sHIPMENTS: "shipments",
  REMOVE: "Remove",
  EDIT: "Edit",
  REMOVE_SHIPPING_COMPANY_TITLE: "Remove shipping company",
  ACTIVATE_SHIPPING_COMPANY_TITLE: "Activate shipping company",
  DEACTIVATE_SHIPPING_COMPANY_TITLE: "Deactivate shipping company",
  REMOVE_SHIPPING_COMPANY_MESSAGE:
    "Are you sure you want to remove the shipping company",
  ACTIVATE_SHIPPING_COMPANY_MESSAGE:
    "Are you sure you want to activate the shipping company",
  DEACTIVATE_SHIPPING_COMPANY_MESSAGE:
    "Are you sure you want to deactivate the shipping company",
  ALL: "All",
  ADD_NEW_SHIPPING_COMPANY: "Add New Shipping Company",

  CITY: "City",
  STREET: "Street",

  LOCAL_SHIPPING: "Local Shipping",
  INTERNATIONAL_SHIPPING: "International Shipping",
  CASH_ON_DELIVERY: "Cash On Delivery",
  SHIPMENTS: "Shipments",

  AT_LEAST_SHIPPING_METHOD:
    "You should add at least one shipping method (Local/International)",
  COMPANY_NAME: "Company name",
  SERVICE_NAME: "Service name",
  SERVICE_NAME_HINT:
    "The service name that will be to link with the correct company API at the development team.",
  LOCAL_PRICE: "Local price",
  MAXIMUM_WEIGHT: "Maximum weight",
  MAXIMUM_WEIGHT_HINT:
    "The maximum number of weight that is supported for the provided local price.",
  EXTRA_WEIGHT_PRICE: "Extra weight price",
  EXTRA_WEIGHT_PRICE_HINT:
    "The price of extra weight that will be more than the maximum weight.",
  KG: "KG",
  CASH_ON_DELIVERY_SERVICE: "Cash-on-delivery Service",
  CASH_ON_DELIVERY_SERVICE_PRICE: "Cash-on-delivery service price",
  APPEARANCE_CONFIG: "Appearance Configuration",
  SUMMARY: "Summary",
  PACKAGE_REQUESTS: "Package Requests",
  totalEarnings: "Total Earnings",
  VIEW_SHIPMENTS: "View Shipments",
  VIEW_PACKAGE_REQUESTS: "View Package Requests",
  SOMETHING_WENT_WRONG_WHEN_CREATE_LOGO_IMAGE:
    "Something went wrong while creating the logo image!",
  SOMETHING_WENT_WRONG_WHEN_UPLOAD_LOGO_IMAGE:
    "Something went wrong while uploading the logo image!",
  UPLOADED: "Uploaded",
  UPLOAD_ICON: "Upload Icon",
  UPLOAD_LOGO: "Upload Logo",
  LOGO_IMAGE: "Logo Image",
  ICON_IMAGE: "Icon Image",
  LOGO_IMAGE_HINT: "Company logo that will be at tables and big places",
  ICON_IMAGE_HINT: "Company icon logo that will be at sidebar and small places",
  COLOR: "Color",

  INTERNATIONAL_PROFITS_RATE: "International profits rate",
  INTERNATIONAL_PROFITS_EXTRAS: "International profits extras",

  DEACTIVATE: "Deactivate",
  ACTIVATE: "Activate",
  COUNTRIES: "Countries",
  VIEW_COUNTRIES: "View Countries",
  STATES: "States",
  VIEW_STATES: "View States",
  CITIES: "Cities",
  VIEW_CITIES: "View Cities",

  HAS_STATE: "Require state address",
  IS_ENGLISH: "Require information in english language",
  RETURN_FEES: "Return Fees",
};

Object.assign(locale, {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  VIEW: "View",
  LOCAL: "Local",
  INTERNATIONAL: "International",
  RETRY: "Retry",
  LOAD_ERROR: "Could not load shipping companies. Please retry.",
  COD_REQUIRES_LOCAL: "Cash on delivery requires local shipping.",
  SHIPMENT_FEES: "Shipment fees",
  SHIPMENT_COD_FEES: "Shipment cash-on-delivery fees",
  SHIPMENT_EXTRA_FEES: "Shipment extra-weight fees",
  SHIPMENT_RETURN_FEES: "Shipment return fees",
  FUEL_FEES_PERCENTAGE: "Fuel fees percentage",
  FEES: "Fees",
});
export default locale;
