const locale = {
  CREATE_ERROR: "Unable to submit affiliate withdrawal. Please try again.",
  RETRY: "Retry",
  LOAD_ERROR: "Unable to load affiliate withdrawals",
  USER_LOOKUP_ERROR: "Unable to load the selected account",
  BALANCE_LOAD_ERROR: "Unable to load affiliate balance",
  PENDING_LOAD_ERROR: "Unable to check pending requests",
  RESET_FILTERS: "Reset filters",
  FILTER_REQUESTS: "Filter affiliate withdrawals",
  DECISION_UNAVAILABLE: "This withdrawal can no longer be reviewed",
  IMAGE_LOAD_ERROR: "Unable to load the receipt image",
  PENDING_REQUEST_EXISTS: "A withdrawal request is already pending review.",
  READ_ONLY_REQUEST: "Submitted withdrawal requests are read-only.",
  NO_AVAILABLE_BALANCE: "A positive available balance is required.",
  REFRESH_ACCOUNT_ERROR:
    "The request was submitted, but the account could not be refreshed.",

  WITHDRAW_REQUESTS: "Affiliate Withdraw Requests",
  SEARCH_WITHDRAW_REQUESTS: "Search Affiliate Withdraw Requests",
  ADD_WITHDRAW_REQUEST: "Add Withdraw Request",
  SAVE_WITHDRAW_REQUEST: "Add Withdraw Request",
  NO_WITHDRAW_REQUESTS: "There are no withdraw requests!",
  NAME: "Name",
  REQUIRED_FIELD: "Required field",
  TWO_CHARACTERS_AT_LEAST: "You must enter 2 characters at least",

  ADD_NEW_WITHDRAW_REQUEST: "Add A New Withdraw Request",
  EDIT_WITHDRAW_REQUEST: "Edit Withdraw Request",

  WITHDRAW_REQUEST_DETAILS: "Withdraw Request Details",
  NO_SUCH_WITHDRAW_REQUEST: "No such withdraw request!",
  GO_TO_WITHDRAW_REQUESTS: "Go To Affiliate Withdraw Requests",
  REMOVE: "Remove",
  REMOVING: "Removing..",
  SAVE: "Save",
  BASIC_INFO: "Basic Info",

  SOMETHING_WENT_WRONG_WHEN_SAVE_WITHDRAW_REQUEST:
    "Something went wrong while saving withdraw request!",
  SOMETHING_WENT_WRONG_WHEN_ADD_WITHDRAW_REQUEST:
    "You have a previous request! Please wait until it is processed.",
  SOMETHING_WENT_WRONG_WHEN_REMOVE_WITHDRAW_REQUEST:
    "Something went wrong while removing withdraw request!",

  WITHDRAW_REQUEST_SAVED_SUCCESSFULLY: "Withdraw Request saved successfully",
  WITHDRAW_REQUEST_REMOVED_SUCCESSFULLY:
    "Withdraw Request removed successfully",

  SOMETHING_WENT_WRONG_WHEN_GET_WITHDRAW_REQUESTS:
    "Something went wrong while getting the withdraw requests!",
  WITHDRAW_REQUESTS_OF_MERCHANT: "Affiliate Withdraw Requests Of Merchant",
  ALL_WITHDRAW_REQUESTS: "All Affiliate Withdraw Requests",
  MERCHANT: "Merchant",
  SELECT_SINGLE_MERCHANT: "Select single merchant",
  ALL: "All",
  START_DATE: "Start date",
  END_DATE: "End date",
  ID: "Reference",
  TRANSACTION_ID: "Transaction ID",
  AMOUNT: "Amount",
  TOTAL_AMOUNT: "Total Amount",
  STATUS: "Status",
  CREATED_AT: "Created At",
  UPDATED_AT: "Updated At",
  SHOULD_BE_MORE_THAN_100: "Should be more than or equals 100 SAR",
  PAYMENT_METHODS: "Payment Methods",
  PLEASE_SELECT_PAYMENT_METHOD_BEFORE_WITHDRAW:
    "Please select a payment method before withdraw the balance",
  NO_SUCH_WITHDRAW_REQUEST_MERCHANT: "There is no such merchant!",
  EDIT_WALLET_BALANCE_FOR: "Edit Wallet Balance For Merchant",
  WITHDRAW_WALLET_BALANCE: "Withdraw Wallet Balance",
  EDIT_WALLET_BALANCE: "Edit Wallet Balance",
  CREATE_TRANSACTION_AND_PAY: "Create Transaction & Pay",
  CREATE_TRANSACTION: "Create Transaction",
  BALANCE_CHANGES: "Balance Changes",
  PREVIOUS_BALANCE: "Previous balance",
  BALANCE_AFTER_TRANSACTION: "Balance after transaction",
  CURRENT_BALANCE: "Available Withdrawal Balance",
  MERCHANT_BALANCE: "Available Withdrawal Balance",
  WITHDRAW_BALANCE: "Withdraw Balance",
  WITHDRAW_BALANCE_DETAILS: "Withdraw Balance Details",
  WITHDRAW_BALANCE_AMOUNT: "Withdraw balance amount",
  WITHDRAW_BALANCE_HINT:
    "The withdraw amount that is entered should be less than or equals to the available withdrawal balance.",
  SUBTOTAL: "Subtotal",
  PAYMENT_METHOD_FEES: "Payment method fees",
  TAX: "Tax",
  TOTAL: "Total",
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  REFUSED: "Refused",
  TRANSACTION_NOTES: "Transaction Notes",
  TRANSACTION_AMOUNT: "Transaction amount",
  TRANSACTION_DETAILS: "Transactions Details",
  EDIT_BALANCE: "Edit Balance",
  PAYMENT_METHOD: "Payment Method",
  SOMETHING_WENT_WRONG_WHEN_GET_ORDER_DETAILS:
    "Something went wrong while getting the patyment details!",
  SOMETHING_WENT_WRONG_WHEN_CONFIRM_PAYMENT:
    "Something went wrong while confirming the payment!",

  PAYMENT_DONE: "Payment done successfully!",
  PAYMENT_DONE_MESSAGE_1:
    "Thank you for your choice!. You have registered with the following products",
  PAYMENT_DONE_MESSAGE_2: "We wish for you the best in the learning journey",
  SOMETHING_WENT_WRONG: "Something went wrong!",
  PAYMENT_ERROR_0: "Something went wrong!",
  PAYMENT_ERROR_1:
    "3DS Authentication failed (wrong password, cardholder/card issuer are not enrolled with 3DS, or the issuer bank has a technical issue).",
  PAYMENT_ERROR_2: "The issuer bank has declined the transaction.",
  PAYMENT_ERROR_3: "The transaction has been blocked from the gateway.",
  PAYMENT_ERROR_4: "Insufficient funds",
  PAYMENT_ERROR_5: "Session timeout",
  PAYMENT_ERROR_6: "Transaction canceled",
  PAYMENT_ERROR_7: "The card is expired.",
  PAYMENT_ERROR_8: "The card issuer doesn't respond.",
  PAYMENT_ERROR_9: "Denied by risk.",
  PAYMENT_ERROR_10: "Wrong security code",
  PAYMENT_ERROR_11: "Unspecified failure",
  ACTIONS: "Actions",
  CHECK_STATUS: "Check",
  NOT_EXIST: "Not exist",
  NOT_EXIST_TRANSACTION_ID: "Transaction id is not exist",
  CONVERT_TO_CONFIRMED: "Convert To Confirmed",
  CONVERT_TO_CONFIRMED_TITLE:
    "Convert the withdraw request to the confirmed status",
  CONVERT_TO_REFUSED: "Convert To Refused",
  CONVERT_TO_REFUSED_TITLE:
    "Convert the withdraw request to the refused status",
  CONVERT: "Convert",
  CONVERT_TO_CONFIRMED_MESSAGE:
    "Are you sure you want to convert the withdraw request to the confirmed status?",
  SOMETHING_WENT_WRONG_WHEN_CONVERT_TO_CONFIRMED:
    "Something went wrong while converting to the confirmed status!",
  CONVERTED_TO_CONFIRMED_SUCCESSFULLY:
    "Converted to the confirmed status successfully",
  CONVERT_TO_REFUSED_MESSAGE:
    "Are you sure you want to convert the withdraw request to the refused status?",
  SOMETHING_WENT_WRONG_WHEN_CONVERT_TO_REFUSED:
    "Something went wrong while converting to the refused status!",
  CONVERTED_TO_REFUSED_SUCCESSFULLY:
    "Converted to the refused status successfully",
  REQUEST_NOTES: "Request Notes (Please type your banking details)",
  REQUEST_DETAILS: "Request Details",

  TRANSACTION_REFERENCE: "Transaction Reference",
  UPLOAD_TRANSACTION_IMAGE: "Upload Transaction Image",
  UPLOADED: "Uploaded",
  SOMETHING_WENT_WRONG_WHEN_CREATE_TRANSACTION_IMAGE:
    "Something went wrong while creating the transaction image!",
  SOMETHING_WENT_WRONG_WHEN_DOWNLOAD_TRANSACTION_IMAGE:
    "Something went wrong while downloading the transaction image!",
  SOMETHING_WENT_WRONG_WHEN_UPLOAD_TRANSACTION_IMAGE:
    "Something went wrong while uploading the transaction image!",
  TRANSACTION_IMAGE: "Transaction Image",
  DOWNLOAD: "Download",
  DOWNLOADING: "Downloading..",
  CANCEL: "Cancel",
  REFUSE: "Refuse",
  ACCEPT: "Accept",
  SHOULD_BE_LESS_THAN_OR_EQUAL: "Should be less than or equals to",
  REQUEST_NOTES_: "Request Notes",

  COD_SHIPMENTS: "COD Shipments",
  SELECT_SHIPMENTS_MESSAGE:
    "Please select the shipments that you want to withdraw the payment amounts of them.",
  SHOULD_SELECT_AT_LEAST_ONE_SHIPMENT:
    "You should select at least one shipment",
  SENDER: "Sender",
  RECEIVER: "Receiver",
  REQUEST_CONVERT_WALLET: "Request Convert To Wallet",
  WALLET_CHARGE: "Wallet Charge",
  WITHDRAW: "Withdraw",
  OTHER: "Other",
  TYPE: "Type",
  NOTES: "Notes",

  NO_WAYBILL: "No Waybill",
  REFERENCE: "Reference",

  TOPUP_AMOUNT: "Topup Amount if the Wallet topup selected",
  WITHDRAW_AMOUNT:
    "Withdraw Amount if directly withdraw selected (Tax included)",

  UPDATED_BY: "Updated By",
  SELECT_SINGLE_EMPLOYEE: "Select single employee",

  AFFILIATE_WITHDRAW_REQUESTS: "Withdraw Requests",
  CURRENT_AFFILIATE_BALANCE: "Current Affiliate Balance",
  MERCHANT_AFFILIATE_BALANCE: "Merchant Affiliate Balance",
};

export default locale;
