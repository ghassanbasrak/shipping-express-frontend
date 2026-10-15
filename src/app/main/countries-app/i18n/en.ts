const locale = {
  COUNTRIES: "Countries",
  SEARCH_COUNTRIES: "Search Countries",
  ADD_COUNTRY: "Add Country",
  SAVE_COUNTRY: "Save Country",
  NO_COUNTRIES: "There are no countries!",
  NAME: "Name",
  SUBZONE_NAME: "Subzone Name",
  REGION: "Region",
  CODE: "Code",
  DIAL_CODE: "Dial Code",
  FLAG_URL: "Flag URL",
  REQUIRED_FIELD: "Required field",
  TWO_CHARACTERS_AT_LEAST: "You must enter 2 characters at least",
  TWO_CHARACTERS_MAX: "You must enter 2 characters maximum",
  UPPERCASE: "You must enter two characters in uppercase only",
  INVALID_URL: "Invalid url",

  ADD_NEW_COUNTRY: "Add A New Country",
  EDIT_COUNTRY: "Edit Country",

  COUNTRY_DETAILS: "Country Details",
  NO_SUCH_COUNTRY: "No such country!",
  GO_TO_COUNTRIES: "Go To Countries",
  REMOVE: "Remove",
  REMOVING: "Removing..",
  SAVE: "Save",
  BASIC_INFO: "Basic Info",

  SOMETHING_WENT_WRONG_WHEN_SAVE_COUNTRY:
    "Something went wrong while saving country!",
  SOMETHING_WENT_WRONG_WHEN_ADD_COUNTRY:
    "Something went wrong while adding country!",
  SOMETHING_WENT_WRONG_WHEN_REMOVE_COUNTRY:
    "Something went wrong while removing country!",
  SOMETHING_WENT_WRONG_WHEN_SAVE_STATE:
    "Something went wrong while saving state!",
  SOMETHING_WENT_WRONG_WHEN_ADD_STATE:
    "Something went wrong while adding state!",
  SOMETHING_WENT_WRONG_WHEN_REMOVE_STATE:
    "Something went wrong while removing state!",

  COUNTRY_SAVED_SUCCESSFULLY: "Country saved successfully",
  COUNTRY_REMOVED_SUCCESSFULLY: "Country removed successfully",
  STATE_SAVED_SUCCESSFULLY: "State saved successfully",
  STATE_ADDED_SUCCESSFULLY: "State added successfully",
  STATE_REMOVED_SUCCESSFULLY: "State removed successfully",
  STATES: "States",
  PLEASE_FILL_ALL_REQUIRED_FIELDS: "Please fill all required fields",
  NEW_STATE: "New State",
  STATE_NAME: "State Name",
  SAVING: "Saving",
  ADD_STATE: "Add State",
  ADD: "Add",
  ADDING: "Adding...",

  //! new
  REMOVE_COUNTRY_TITLE: "Remove country",
  REMOVE_COUNTRY_MESSAGE: "Are you sure you want to remove this country?",
  VIEW: "View",
  SOMETHING_WENT_WRONG_WHEN_GET_COUNTRIES:
    "Something went wrong while getting the countries!",

  SHIPPING_COMPANY: "Shipping Company",
  ALL: "All",
  START_DATE: "Start date",
  END_DATE: "End date",
  SHIPPING_COMPANIES: "Shipping Companies",
  EDIT_NAMES: "Edit Names",
  NAMES_CONFIG: "Naming Configuration",
  SOMETHING_WENT_WRONG_WHEN_SAVE_SHIPMENT_COUNTRY:
    "Something went wrong while saving the country name!",
  SOMETHING_WENT_WRONG_WHEN_REMOVE_SHIPMENT_COUNTRY:
    "Something went wrong while removing the country name!",
  SOMETHING_WENT_WRONG_WHEN_ACTIVATE_SHIPMENT_COUNTRY:
    "Something went wrong while activating the country name!",
  SOMETHING_WENT_WRONG_WHEN_DEACTIVATE_SHIPMENT_COUNTRY:
    "Something went wrong while deactivating the country name!",
  SHIPMENT_COUNTRY_SAVED_SUCCESSFULLY: "Country name saved successfully",
  SHIPMENT_COUNTRY_REMOVED_SUCCESSFULLY: "Country name removed successfully",
  SHIPMENT_COUNTRY_ACTIVATED_SUCCESSFULLY:
    "Country name activated successfully",
  SHIPMENT_COUNTRY_DEACTIVATED_SUCCESSFULLY:
    "Country name deactivated successfully",
  CHANGE_NAMES_AFTER_SAVE:
    "You can change the name of shipping companies when you add the country",
  OTHER_COUNTRY_DETAILS: "Other Country Details",
  CREATED_AT: "Created At",
  ACTIONS: "Actions",
  CHANGE_NAMING_CONFIG_FOR: "Change naming config for the country",
  VIEW_STATES: "View States",
};

Object.assign(locale, {
  RETRY: "Retry",
  CANCEL: "Cancel",
  CLOSE: "Close",
  RESET_FILTERS: "Reset filters",
  ACTIVE: "Active",
  LOOKUP_ERROR: "Could not load shipping companies. Please retry.",
  LANGUAGES_ERROR:
    "Could not load additional languages. Arabic and English are available.",
  PARTIAL_SAVE:
    "The country was saved, but some shipping-company names could not be saved. Your changes are kept here so you can retry.",
  PARTIAL_REMOVE:
    "The country was removed, but some shipping-company mappings could not be cleaned up.",
  SOMETHING_WENT_WRONG: "The request failed. Please try again.",
  SEARCH_STATES: "Search states",
  STATE_PREVIEW: "States",
  NO_STATES: "There are no states for this country.",
  CHANGES_NOT_SAVED: "Some changes have not been saved.",
});
export default locale;
