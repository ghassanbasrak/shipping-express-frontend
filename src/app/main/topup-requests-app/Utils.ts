import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
import { availableTransactionBalances } from "../transactions-app/Utils";
import ITopupRequest from "./models/ITopupRequest";
export const topupRequestStatus = {
  pending: "pending",
  confirmed: "success",
  refused: "failed",
};

export const topupRequestEntityTypes = {
  mada: "MADA",
  visa: "VISA",
  master: "MASTER",
  stcPay: "STC_PAY",
  applePay: "APPLEPAY",
};

export const toTopupRequestEntityTypeTitle = (status) => {
  switch (status) {
    case topupRequestEntityTypes.mada:
      return "MADA";
    case topupRequestEntityTypes.visa:
      return "VISA";
    case topupRequestEntityTypes.master:
      return "MASTER";
    case topupRequestEntityTypes.stcPay:
      return "STC_PAY";
    case topupRequestEntityTypes.applePay:
      return "APPLEPAY";
  }
  return "MADA";
};
export const toTopupRequestEntityTypeImage = (status) => {
  switch (status) {
    case topupRequestEntityTypes.mada:
      return "mada.png";
    case topupRequestEntityTypes.visa:
      return "visa.png";
    case topupRequestEntityTypes.master:
      return "master.png";
    case topupRequestEntityTypes.stcPay:
      return "stcpay.png";
    case topupRequestEntityTypes.applePay:
      return "applepay.png";
  }
  return "mada.png";
};

export const toTopupRequestStatusTitle = (status) => {
  switch (status) {
    case topupRequestStatus.pending:
      return "PENDING";
    case topupRequestStatus.confirmed:
      return "CONFIRMED";
    case topupRequestStatus.refused:
      return "REFUSED";
  }
  return "PENDING";
};

export const toTopupRequestStatusColor = (status) => {
  switch (status) {
    case topupRequestStatus.pending:
      return "bg-blue-600";
    case topupRequestStatus.confirmed:
      return "bg-green-600";
    case topupRequestStatus.refused:
      return "bg-red-600";
  }
  return "bg-blue-600";
};

export const getHyperpayResultCodeError = (code, lang) => {
  return (
    (lang === "ar"
      ? hyperpayArabicResultCodes
      : hyperpayEnglishResultCodes
    ).find((item) => item.code === code)?.description ??
    (lang === "ar" ? "خطأ غير معروف" : "Unknown Error")
  );
};

export const getPayTabsResultCodeError = (status, code, message, lang) => {
  if (status === "A") return "";
  const resultCode = (
    lang === "ar" ? paytabsArabicResultCodes : paytabsEnglishResultCodes
  ).find((item) => item.status === status && item.code === code);

  if (!resultCode)
    return message || (lang === "ar" ? "خطأ غير معروف" : "Unknown Error");
  return `${resultCode.message} / ${resultCode.reason}`;
};

const hyperpayEnglishResultCodes = [
  { code: "000.000.000", description: "Transaction succeeded" },
  { code: "000.000.100", description: "successful request" },
  {
    code: "000.100.105",
    description: "Chargeback Representment is successful",
  },
  {
    code: "000.100.106",
    description: "Chargeback Representment cancellation is successful",
  },
  {
    code: "000.100.110",
    description:
      "Request successfully processed in 'Merchant in Integrator Test Mode'",
  },
  {
    code: "000.100.111",
    description:
      "Request successfully processed in 'Merchant in Validator Test Mode'",
  },
  {
    code: "000.100.112",
    description:
      "Request successfully processed in 'Merchant in Connector Test Mode'",
  },
  { code: "000.100.200", description: "Reason not Specified" },
  { code: "000.100.201", description: "Account or Bank Details Incorrect" },
  { code: "000.100.202", description: "Account Closed" },
  { code: "000.100.203", description: "Insufficient Funds" },
  { code: "000.100.204", description: "Mandate not Valid" },
  { code: "000.100.205", description: "Mandate Cancelled" },
  { code: "000.100.206", description: "Revocation or Dispute" },
  { code: "000.100.207", description: "Cancellation in Clearing Network" },
  { code: "000.100.208", description: "Account Blocked" },
  { code: "000.100.209", description: "Account does not exist" },
  { code: "000.100.210", description: "Invalid Amount" },
  {
    code: "000.100.211",
    description:
      "Transaction succeeded (amount of transaction is smaller then amount of pre-authorization)",
  },
  {
    code: "000.100.212",
    description:
      "Transaction succeeded (amount of transaction is greater then amount of pre-authorization)",
  },
  { code: "000.100.220", description: "Fraudulent Transaction" },
  { code: "000.100.221", description: "Merchandise Not Received" },
  {
    code: "000.100.222",
    description: "Transaction Not Recognized By Cardholder",
  },
  { code: "000.100.223", description: "Service Not Rendered" },
  { code: "000.100.224", description: "Duplicate Processing" },
  { code: "000.100.225", description: "Credit Not Processed" },
  { code: "000.100.226", description: "Cannot be settled" },
  { code: "000.100.227", description: "Configuration Issue" },
  {
    code: "000.100.228",
    description: "Temporary Communication Error - Retry",
  },
  { code: "000.100.229", description: "Incorrect Instructions" },
  { code: "000.100.230", description: "Unauthorised Charge" },
  { code: "000.100.231", description: "Late Representment" },
  { code: "000.100.232", description: "Liability Shift" },
  { code: "000.100.233", description: "Authorization-Related Chargeback" },
  { code: "000.100.234", description: "Non receipt of merchandise" },
  { code: "000.100.299", description: "Unspecified (Technical)" },
  { code: "000.200.000", description: "transaction pending" },
  {
    code: "000.200.001",
    description:
      "Transaction pending for acquirer, the consumer is not present",
  },
  { code: "000.200.100", description: "successfully created checkout" },
  { code: "000.200.101", description: "successfully updated checkout" },
  { code: "000.200.102", description: "successfully deleted checkout" },
  { code: "000.200.103", description: "checkout is pending" },
  { code: "000.200.200", description: "Transaction initialized" },
  {
    code: "000.200.201",
    description:
      "QR Scanned/Link Clicked, waiting for the final authentication result",
  },
  { code: "000.200.999", description: "Token Vault usage disabled" },
  { code: "000.300.000", description: "Two-step transaction succeeded" },
  { code: "000.300.100", description: "Risk check successful" },
  { code: "000.300.101", description: "Risk bank account check successful" },
  { code: "000.300.102", description: "Risk report successful" },
  { code: "000.300.103", description: "Exemption check successful" },
  { code: "000.310.100", description: "Account updated" },
  {
    code: "000.310.101",
    description: "Account updated (Credit card expired)",
  },
  {
    code: "000.310.110",
    description: "No updates found, but account is valid",
  },
  {
    code: "000.400.000",
    description:
      "Transaction succeeded (please review manually due to fraud suspicion)",
  },
  {
    code: "000.400.010",
    description:
      "Transaction succeeded (please review manually due to AVS return code)",
  },
  {
    code: "000.400.020",
    description:
      "Transaction succeeded (please review manually due to CVV return code)",
  },
  {
    code: "000.400.030",
    description:
      "Transaction partially failed (please reverse manually due to failed automatic reversal)",
  },
  {
    code: "000.400.040",
    description:
      "Transaction succeeded (please review manually due to amount mismatch)",
  },
  {
    code: "000.400.050",
    description:
      "Transaction succeeded (please review manually because transaction is pending)",
  },
  {
    code: "000.400.060",
    description: "Transaction succeeded (approved at merchant's risk)",
  },
  {
    code: "000.400.070",
    description: "Transaction succeeded (waiting for external risk review)",
  },
  {
    code: "000.400.080",
    description:
      "Transaction succeeded (please review manually because the service was unavailable)",
  },
  {
    code: "000.400.081",
    description:
      "Transaction succeeded (please review manually, as the risk status not available yet due network timeout)",
  },
  {
    code: "000.400.082",
    description:
      "Transaction succeeded (please review manually, as the risk status not available yet due processing timeout)",
  },
  {
    code: "000.400.090",
    description:
      "Transaction succeeded (please review manually due to external risk check)",
  },
  {
    code: "000.400.100",
    description: "Transaction succeeded, risk after payment rejected",
  },
  {
    code: "000.400.101",
    description: "card not participating/authentication unavailable",
  },
  { code: "000.400.102", description: "user not enrolled" },
  { code: "000.400.103", description: "Technical Error in 3D system" },
  {
    code: "000.400.104",
    description: "Missing or malformed 3DSecure Configuration for Channel",
  },
  {
    code: "000.400.105",
    description: "Unsupported User Device - Authentication not possible",
  },
  {
    code: "000.400.106",
    description:
      "invalid payer authentication response(PARes) in 3DSecure Transaction",
  },
  {
    code: "000.400.107",
    description: "Communication Error to Scheme Directory Server",
  },
  {
    code: "000.400.108",
    description:
      "Cardholder Not Found - card number provided is not found in the ranges of the issuer",
  },
  {
    code: "000.400.109",
    description: "Card is not enrolled for 3DS version 2",
  },
  {
    code: "000.400.110",
    description: "Authentication successful (frictionless flow)",
  },
  { code: "000.400.111", description: "Data Only request failed" },
  { code: "000.400.112", description: "3RI transaction not permitted" },
  {
    code: "000.400.113",
    description: "Protocol version not supported by the issuer ACS",
  },
  {
    code: "000.400.120",
    description: "Authentication successful (data only flow)",
  },
  {
    code: "000.400.200",
    description: "risk management check communication error",
  },
  {
    code: "000.500.000",
    description: "Transaction succeeded - very good rating",
  },
  {
    code: "000.500.100",
    description: "Transaction succeeded (address corrected)",
  },
  {
    code: "000.600.000",
    description: "transaction succeeded due to external update",
  },
  {
    code: "100.100.100",
    description:
      "request contains no creditcard, bank account number or bank name",
  },
  {
    code: "100.100.101",
    description: "invalid creditcard, bank account number or bank name",
  },
  { code: "100.100.104", description: "invalid unique id / root unique id" },
  { code: "100.100.200", description: "request contains no month" },
  { code: "100.100.201", description: "invalid month" },
  { code: "100.100.300", description: "request contains no year" },
  { code: "100.100.301", description: "invalid year" },
  { code: "100.100.303", description: "card expired" },
  { code: "100.100.304", description: "card not yet valid" },
  { code: "100.100.305", description: "invalid expiration date format" },
  {
    code: "100.100.400",
    description: "request contains no cc/bank account holder",
  },
  {
    code: "100.100.401",
    description: "cc/bank account holder too short or too long",
  },
  { code: "100.100.402", description: "cc/bank account holder not valid" },
  {
    code: "100.100.500",
    description: "request contains no credit card brand",
  },
  { code: "100.100.501", description: "invalid credit card brand" },
  {
    code: "100.100.600",
    description: "empty CVV for VISA,MASTER, AMEX not allowed",
  },
  { code: "100.100.601", description: "invalid CVV/brand combination" },
  {
    code: "100.100.650",
    description: "empty CreditCardIssueNumber for MAESTRO not allowed",
  },
  { code: "100.100.651", description: "invalid CreditCardIssueNumber" },
  { code: "100.100.700", description: "invalid cc number/brand combination" },
  {
    code: "100.100.701",
    description: "suspecting fraud, this card may not be processed",
  },
  {
    code: "100.150.100",
    description: "request contains no Account data and no registration id",
  },
  {
    code: "100.150.101",
    description:
      "invalid format for specified registration id (must be uuid format)",
  },
  { code: "100.150.200", description: "registration does not exist" },
  { code: "100.150.201", description: "registration is not confirmed yet" },
  {
    code: "100.150.202",
    description: "registration is already deregistered",
  },
  {
    code: "100.150.203",
    description: "registration is not valid, probably initially rejected",
  },
  {
    code: "100.150.204",
    description:
      "account registration reference pointed to no registration transaction",
  },
  {
    code: "100.150.205",
    description: "referenced registration does not contain an account",
  },
  { code: "100.150.206", description: "Retention period expired" },
  {
    code: "100.150.300",
    description: "payment only allowed with valid initial registration",
  },
  {
    code: "100.200.100",
    description: "bank account contains no or invalid country",
  },
  {
    code: "100.200.103",
    description:
      "bank account has invalid bankcode/name account number combination",
  },
  {
    code: "100.200.104",
    description: "bank account has invalid acccount number format",
  },
  {
    code: "100.200.200",
    description:
      "bank account needs to be registered and confirmed first. Country is mandate based.",
  },
  {
    code: "100.210.101",
    description: "virtual account contains no or invalid Id",
  },
  {
    code: "100.210.102",
    description: "virtual account contains no or invalid brand",
  },
  {
    code: "100.211.101",
    description: "user account contains no or invalid Id",
  },
  {
    code: "100.211.102",
    description: "user account contains no or invalid brand",
  },
  {
    code: "100.211.103",
    description: "no password defined for user account",
  },
  {
    code: "100.211.104",
    description:
      "password does not meet safety requirements (needs 8 digits at least and must contain letters and numbers)",
  },
  {
    code: "100.211.105",
    description: "wallet id has to be a valid email address",
  },
  { code: "100.211.106", description: "voucher ids have 32 digits always" },
  {
    code: "100.212.101",
    description: "wallet account registration must not have an initial balance",
  },
  {
    code: "100.212.102",
    description: "wallet account contains no or invalid brand",
  },
  {
    code: "100.212.103",
    description:
      "wallet account payment transaction needs to reference a registration",
  },
  {
    code: "100.250.100",
    description: "job contains no execution information",
  },
  { code: "100.250.105", description: "invalid or missing action type" },
  { code: "100.250.106", description: "invalid or missing duration unit" },
  { code: "100.250.107", description: "invalid or missing notice unit" },
  { code: "100.250.110", description: "missing job execution" },
  { code: "100.250.111", description: "missing job expression" },
  {
    code: "100.250.120",
    description:
      "invalid execution parameters, combination does not conform to standard",
  },
  {
    code: "100.250.121",
    description: "invalid execution parameters, hour must be between 0 and 23",
  },
  {
    code: "100.250.122",
    description:
      "invalid execution parameters, minute and seconds must be between 0 and 59",
  },
  {
    code: "100.250.123",
    description:
      "invalid execution parameters, Day of month must be between 1 and 31",
  },
  {
    code: "100.250.124",
    description: "invalid execution parameters, month must be between 1 and 12",
  },
  {
    code: "100.250.125",
    description:
      "invalid execution parameters, Day of week must be between 1 and 7",
  },
  { code: "100.250.250", description: "Job tag missing" },
  {
    code: "100.300.101",
    description:
      "invalid test mode (please use LIVE or INTEGRATOR_TEST or CONNECTOR_TEST)",
  },
  { code: "100.300.200", description: "transaction id too long" },
  { code: "100.300.300", description: "invalid reference id" },
  { code: "100.300.400", description: "missing or invalid channel id" },
  { code: "100.300.401", description: "missing or invalid sender id" },
  { code: "100.300.402", description: "missing or invalid version" },
  { code: "100.300.501", description: "invalid response id" },
  { code: "100.300.600", description: "invalid or missing user login" },
  { code: "100.300.601", description: "invalid or missing user pwd" },
  { code: "100.300.700", description: "invalid relevance" },
  {
    code: "100.300.701",
    description: "invalid relevance for given payment type",
  },
  {
    code: "100.310.401",
    description: "Account management type not supported",
  },
  {
    code: "100.310.402",
    description: "Account management transaction not allowed in current state",
  },
  {
    code: "100.350.100",
    description: "referenced session is REJECTED (no action possible).",
  },
  {
    code: "100.350.101",
    description: "referenced session is CLOSED (no action possible)",
  },
  { code: "100.350.200", description: "undefined session state" },
  {
    code: "100.350.201",
    description:
      "referencing a registration through reference id is not applicable for this payment type",
  },
  {
    code: "100.350.301",
    description: "confirmation (CF) must be registered (RG) first",
  },
  { code: "100.350.302", description: "session already confirmed (CF)" },
  {
    code: "100.350.303",
    description: "cannot deregister (DR) unregistered account and/or customer",
  },
  { code: "100.350.310", description: "cannot confirm (CF) session via XML" },
  {
    code: "100.350.311",
    description: "cannot confirm (CF) on a registration passthrough channel",
  },
  {
    code: "100.350.312",
    description: "cannot do passthrough on non-internal connector",
  },
  {
    code: "100.350.313",
    description: "registration of this type has to provide confirmation url",
  },
  {
    code: "100.350.314",
    description:
      "customer could not be notified of pin to confirm registration (channel)",
  },
  {
    code: "100.350.315",
    description:
      "customer could not be notified of pin to confirm registration (sending failed)",
  },
  {
    code: "100.350.316",
    description: "cannot extend the token (TE) on unregistered account",
  },
  {
    code: "100.350.400",
    description:
      "no or invalid PIN (email/SMS/MicroDeposit authentication) entered",
  },
  {
    code: "100.350.500",
    description:
      "unable to obtain personal (virtual) account - most likely no more accounts available",
  },
  {
    code: "100.350.601",
    description: "registration is not allowed to reference another transaction",
  },
  {
    code: "100.350.602",
    description: "Registration is not allowed for recurring payment migration",
  },
  { code: "100.360.201", description: "unknown schedule type" },
  { code: "100.360.300", description: "cannot schedule(SD) unscheduled job" },
  {
    code: "100.360.303",
    description: "cannot deschedule(DS) unscheduled job",
  },
  {
    code: "100.360.400",
    description: "schedule module not configured for LIVE transaction mode",
  },
  { code: "100.370.100", description: "transaction declined" },
  {
    code: "100.370.101",
    description: "responseUrl not set in Transaction/Frontend",
  },
  {
    code: "100.370.102",
    description: "malformed responseUrl in Transaction/Frontend",
  },
  {
    code: "100.370.110",
    description: "transaction must be executed for German address",
  },
  {
    code: "100.370.111",
    description: "system error( possible incorrect/missing input data)",
  },
  {
    code: "100.370.121",
    description: "no or unknown ECI Type defined in Authentication",
  },
  {
    code: "100.370.122",
    description: "parameter with null key provided in 3DSecure Authentication",
  },
  {
    code: "100.370.123",
    description:
      "no or unknown verification type defined in 3DSecure Authentication",
  },
  {
    code: "100.370.124",
    description: "unknown parameter key in 3DSecure Authentication",
  },
  {
    code: "100.370.125",
    description:
      "Invalid 3DSecure Verification_ID. Must have Base64 encoding a Length of 28 digits",
  },
  {
    code: "100.370.131",
    description:
      "no or unknown authentication type defined in Transaction/Authentication@type",
  },
  {
    code: "100.370.132",
    description:
      "no result indicator defined Transaction/Authentication/resultIndicator",
  },
  {
    code: "100.380.101",
    description: "transaction contains no risk management part",
  },
  {
    code: "100.380.201",
    description: "no risk management process type specified",
  },
  {
    code: "100.380.305",
    description:
      "no frontend information provided for asynchronous transaction",
  },
  {
    code: "100.380.306",
    description:
      "no authentication data provided in risk management transaction",
  },
  { code: "100.380.401", description: "User Authentication Failed" },
  { code: "100.380.501", description: "risk management transaction timeout" },
  { code: "100.390.100", description: "3D Secure transaction rejected" },
  { code: "100.390.101", description: "purchase amount/currency mismatch" },
  { code: "100.390.102", description: "PARes Validation failed" },
  {
    code: "100.390.103",
    description: "PARes Validation failed - problem with signature",
  },
  { code: "100.390.104", description: "XID mismatch" },
  {
    code: "100.390.105",
    description:
      "Transaction rejected because of technical error in 3DSecure system",
  },
  {
    code: "100.390.106",
    description:
      "Transaction rejected because of error in 3DSecure configuration",
  },
  {
    code: "100.390.107",
    description:
      "Transaction rejected because cardholder authentication unavailable",
  },
  {
    code: "100.390.108",
    description:
      "Transaction rejected because merchant not participating in 3DSecure program",
  },
  {
    code: "100.390.109",
    description:
      "Transaction rejected because of VISA status 'U' or AMEX status 'N' or 'U' in 3DSecure program",
  },
  {
    code: "100.390.110",
    description:
      "Cardholder Not Found - card number provided is not found in the ranges of the issuer",
  },
  {
    code: "100.390.111",
    description: "Communication Error to Scheme Directory Server",
  },
  { code: "100.390.112", description: "Technical Error in 3D system" },
  {
    code: "100.390.113",
    description: "Unsupported User Device - Authentication not possible",
  },
  {
    code: "100.390.114",
    description:
      "Not authenticated because the issuer is rejecting authentication",
  },
  {
    code: "100.390.115",
    description: "Authentication failed due to invalid message format",
  },
  {
    code: "100.390.116",
    description: "Access denied to the authentication system",
  },
  {
    code: "100.390.117",
    description: "Authentication failed due to invalid data fields",
  },
  {
    code: "100.390.118",
    description: "Authentication failed due to suspected fraud",
  },
  {
    code: "100.390.119",
    description: "Exceeded maximum number of 3DS attempts",
  },
  { code: "100.390.120", description: "Non-payment transaction rejected" },
  { code: "100.390.121", description: "3RI transaction rejected" },
  { code: "100.390.122", description: "Decoupled authentication rejected" },
  {
    code: "100.390.123",
    description: "Exceeded maximum number of PReq messages",
  },
  {
    code: "100.390.124",
    description: "The authentication is cancelled or abandoned",
  },
  { code: "100.395.101", description: "Bank not supported for Giropay" },
  {
    code: "100.395.102",
    description: "Account not enabled for Giropay e.g. test account",
  },
  {
    code: "100.395.501",
    description: "Previously pending online transfer transaction timed out",
  },
  {
    code: "100.395.502",
    description:
      "Acquirer/Bank reported timeout on online transfer transaction",
  },
  { code: "100.396.101", description: "Cancelled by user" },
  { code: "100.396.102", description: "Not confirmed by user" },
  {
    code: "100.396.103",
    description: "Previously pending transaction timed out",
  },
  {
    code: "100.396.104",
    description: "Uncertain status - probably cancelled by user",
  },
  {
    code: "100.396.106",
    description: "User did not agree to payment method terms",
  },
  { code: "100.396.201", description: "Cancelled by merchant" },
  {
    code: "100.397.101",
    description: "Cancelled by user due to external update",
  },
  {
    code: "100.397.102",
    description: "Rejected by connector/acquirer due to external update",
  },
  {
    code: "100.400.000",
    description: "transaction declined (Wrong Address)",
  },
  {
    code: "100.400.001",
    description: "transaction declined (Wrong Identification)",
  },
  {
    code: "100.400.002",
    description: "transaction declined (Insufficient credibility score)",
  },
  {
    code: "100.400.005",
    description: "transaction must be executed for German address",
  },
  {
    code: "100.400.007",
    description: "System error ( possible incorrect/missing input data)",
  },
  { code: "100.400.020", description: "transaction declined" },
  { code: "100.400.021", description: "transaction declined for country" },
  {
    code: "100.400.030",
    description: "transaction not authorized. Please check manually",
  },
  {
    code: "100.400.039",
    description: "transaction declined for other error",
  },
  { code: "100.400.040", description: "authorization failure" },
  {
    code: "100.400.041",
    description: "transaction must be executed for German address",
  },
  {
    code: "100.400.042",
    description:
      "transaction declined by SCHUFA (Insufficient credibility score)",
  },
  {
    code: "100.400.043",
    description:
      "transaction declined because of missing obligatory parameter(s)",
  },
  {
    code: "100.400.044",
    description: "transaction not authorized. Please check manually",
  },
  {
    code: "100.400.045",
    description: "SCHUFA result not definite. Please check manually",
  },
  {
    code: "100.400.051",
    description: "SCHUFA system error (possible incorrect/missing input data)",
  },
  { code: "100.400.060", description: "authorization failure" },
  {
    code: "100.400.061",
    description: "transaction declined (Insufficient credibility score)",
  },
  {
    code: "100.400.063",
    description:
      "transaction declined because of missing obligatory parameter(s)",
  },
  {
    code: "100.400.064",
    description:
      "transaction must be executed for Austrian, German or Swiss address",
  },
  {
    code: "100.400.065",
    description: "result ambiguous. Please check manually",
  },
  {
    code: "100.400.071",
    description: "system error (possible incorrect/missing input data)",
  },
  { code: "100.400.080", description: "authorization failure" },
  { code: "100.400.081", description: "transaction declined" },
  {
    code: "100.400.083",
    description:
      "transaction declined because of missing obligatory parameter(s)",
  },
  {
    code: "100.400.084",
    description: "transaction can not be executed for given country",
  },
  {
    code: "100.400.085",
    description: "result ambiguous. Please check manually",
  },
  {
    code: "100.400.086",
    description: "transaction declined (Wrong Address)",
  },
  {
    code: "100.400.087",
    description: "transaction declined (Wrong Identification)",
  },
  {
    code: "100.400.091",
    description: "system error (possible incorrect/missing input data)",
  },
  {
    code: "100.400.100",
    description: "transaction declined - very bad rating",
  },
  { code: "100.400.120", description: "authorization failure" },
  { code: "100.400.121", description: "account blacklisted" },
  {
    code: "100.400.122",
    description: "transaction must be executed for valid German account",
  },
  {
    code: "100.400.123",
    description:
      "transaction declined because of missing obligatory parameter(s)",
  },
  {
    code: "100.400.130",
    description: "system error (possible incorrect/missing input data)",
  },
  {
    code: "100.400.139",
    description: "system error (possible incorrect/missing input data)",
  },
  { code: "100.400.140", description: "transaction declined by GateKeeper" },
  { code: "100.400.141", description: "Challenge by ReD Shield" },
  { code: "100.400.142", description: "Deny by ReD Shield" },
  { code: "100.400.143", description: "Noscore by ReD Shield" },
  { code: "100.400.144", description: "ReD Shield data error" },
  { code: "100.400.145", description: "ReD Shield connection error" },
  { code: "100.400.146", description: "Line item error by ReD Shield" },
  {
    code: "100.400.147",
    description: "Payment void and transaction denied by ReD Shield",
  },
  {
    code: "100.400.148",
    description: "Payment void and transaction challenged by ReD Shield",
  },
  {
    code: "100.400.149",
    description: "Payment void and data error by ReD Shield",
  },
  {
    code: "100.400.150",
    description: "Payment void and connection error by ReD Shield",
  },
  {
    code: "100.400.151",
    description: "Payment void and line item error by ReD Shield",
  },
  {
    code: "100.400.152",
    description: "Payment void and error returned by ReD Shield",
  },
  { code: "100.400.241", description: "Challenged by Threat Metrix" },
  { code: "100.400.242", description: "Denied by Threat Metrix" },
  { code: "100.400.243", description: "Invalid sessionId" },
  { code: "100.400.260", description: "authorization failure" },
  { code: "100.400.300", description: "abort checkout process" },
  { code: "100.400.301", description: "reenter age/birthdate" },
  {
    code: "100.400.302",
    description: "reenter address (packstation not allowed)",
  },
  { code: "100.400.303", description: "reenter address" },
  { code: "100.400.304", description: "invalid input data" },
  { code: "100.400.305", description: "invalid foreign address" },
  { code: "100.400.306", description: "delivery address error" },
  {
    code: "100.400.307",
    description: "offer only secure methods of payment",
  },
  {
    code: "100.400.308",
    description:
      "offer only secure methods of payment; possibly abort checkout",
  },
  {
    code: "100.400.309",
    description:
      "confirm corrected address; if not confirmed, offer secure methods of payment only",
  },
  {
    code: "100.400.310",
    description:
      "confirm bank account data; if not confirmed, offer secure methods of payment only",
  },
  { code: "100.400.311", description: "transaction declined (format error)" },
  {
    code: "100.400.312",
    description: "transaction declined (invalid configuration data)",
  },
  {
    code: "100.400.313",
    description: "currency field is invalid or missing",
  },
  { code: "100.400.314", description: "amount invalid or empty" },
  {
    code: "100.400.315",
    description: "invalid or missing email address (probably invalid syntax)",
  },
  { code: "100.400.316", description: "transaction declined (card missing)" },
  { code: "100.400.317", description: "transaction declined (invalid card)" },
  { code: "100.400.318", description: "invalid IP number" },
  { code: "100.400.319", description: "transaction declined by risk system" },
  {
    code: "100.400.320",
    description: "shopping cart data invalid or missing",
  },
  { code: "100.400.321", description: "payment type invalid or missing" },
  {
    code: "100.400.322",
    description: "encryption method invalid or missing",
  },
  { code: "100.400.323", description: "certificate invalid or missing" },
  { code: "100.400.324", description: "Error on the external risk system" },
  { code: "100.400.325", description: "External risk system not available" },
  {
    code: "100.400.326",
    description: "Risk bank account check unsuccessful",
  },
  { code: "100.400.327", description: "Risk report unsuccessful" },
  {
    code: "100.400.328",
    description: "Risk report unsuccessful (invalid data)",
  },
  { code: "100.400.500", description: "waiting for external risk" },
  { code: "100.500.101", description: "payment method invalid" },
  { code: "100.500.201", description: "payment type invalid" },
  { code: "100.500.301", description: "invalid due date" },
  { code: "100.500.302", description: "invalid mandate date of signature" },
  { code: "100.500.303", description: "invalid mandate id" },
  { code: "100.500.304", description: "invalid mandate external id" },
  {
    code: "100.550.300",
    description: "request contains no amount or too low amount",
  },
  { code: "100.550.301", description: "amount too large" },
  {
    code: "100.550.303",
    description: "amount format invalid (only two decimals allowed).",
  },
  {
    code: "100.550.310",
    description: "amount exceeds limit for the registered account.",
  },
  { code: "100.550.311", description: "exceeding account balance" },
  {
    code: "100.550.312",
    description: "Amount is outside allowed ticket size boundaries",
  },
  { code: "100.550.400", description: "request contains no currency" },
  { code: "100.550.401", description: "invalid currency" },
  { code: "100.550.601", description: "risk amount too large" },
  {
    code: "100.550.603",
    description: "risk amount format invalid (only two decimals allowed)",
  },
  {
    code: "100.550.605",
    description:
      "risk amount is smaller than amount (it must be equal or bigger then amount)",
  },
  { code: "100.550.701", description: "amounts not matched" },
  { code: "100.550.702", description: "currencies not matched" },
  { code: "100.600.500", description: "usage field too long" },
  { code: "100.700.100", description: "customer.surname may not be null" },
  {
    code: "100.700.101",
    description: "customer.surname length must be between 0 and 50",
  },
  { code: "100.700.200", description: "customer.givenName may not be null" },
  {
    code: "100.700.201",
    description: "customer.givenName length must be between 0 and 50",
  },
  { code: "100.700.300", description: "invalid salutation" },
  { code: "100.700.400", description: "invalid title" },
  { code: "100.700.500", description: "company name too long" },
  {
    code: "100.700.800",
    description: "identity contains no or invalid 'paper'",
  },
  {
    code: "100.700.801",
    description: "identity contains no or invalid identification value",
  },
  { code: "100.700.802", description: "identification value too long" },
  { code: "100.700.810", description: "specify at least one identity" },
  { code: "100.800.100", description: "request contains no street" },
  {
    code: "100.800.101",
    description:
      "The combination of street1 and street2 must not exceed 201 characters.",
  },
  {
    code: "100.800.102",
    description:
      "The combination of street1 and street2 must not contain only numbers.",
  },
  { code: "100.800.200", description: "request contains no zip" },
  { code: "100.800.201", description: "zip too long" },
  { code: "100.800.202", description: "invalid zip" },
  { code: "100.800.300", description: "request contains no city" },
  { code: "100.800.301", description: "city too long" },
  { code: "100.800.302", description: "invalid city" },
  { code: "100.800.400", description: "invalid state/country combination" },
  { code: "100.800.401", description: "state too long" },
  { code: "100.800.500", description: "request contains no country" },
  { code: "100.800.501", description: "invalid country" },
  { code: "100.900.100", description: "request contains no email address" },
  {
    code: "100.900.101",
    description: "invalid email address (probably invalid syntax)",
  },
  {
    code: "100.900.105",
    description: "email address too long (max 50 chars)",
  },
  {
    code: "100.900.200",
    description:
      "invalid phone number (has to start with a digit or a '+', at least 7 and max 25 chars long)",
  },
  {
    code: "100.900.300",
    description:
      "invalid mobile phone number (has to start with a digit or a '+', at least 7 and max 25 chars long)",
  },
  { code: "100.900.301", description: "mobile phone number mandatory" },
  { code: "100.900.400", description: "request contains no ip number" },
  { code: "100.900.401", description: "invalid ip number" },
  { code: "100.900.450", description: "invalid birthdate" },
  { code: "100.900.500", description: "invalid recurrence mode" },
  {
    code: "200.100.101",
    description:
      "invalid Request Message. No valid XML. XML must be url-encoded! maybe it contains a not encoded ampersand or something similar.",
  },
  {
    code: "200.100.102",
    description:
      "invalid Request. XML load missing (XML string must be sent within parameter 'load')",
  },
  {
    code: "200.100.103",
    description:
      "invalid Request Message. The request contains structural errors",
  },
  {
    code: "200.100.150",
    description:
      "transaction of multirequest not processed because of subsequent problems",
  },
  {
    code: "200.100.151",
    description:
      "multi-request is allowed with a maximum of 10 transactions only",
  },
  {
    code: "200.100.199",
    description:
      "Wrong Web Interface / URL used. Please check out the Tech Quick Start Doc Chapter 3.",
  },
  {
    code: "200.100.201",
    description:
      "invalid Request/Transaction tag (not present or [partially] empty)",
  },
  {
    code: "200.100.300",
    description:
      "invalid Request/Transaction/Payment tag (no or invalid code specified)",
  },
  {
    code: "200.100.301",
    description:
      "invalid Request/Transaction/Payment tag (not present or [partially] empty)",
  },
  {
    code: "200.100.302",
    description:
      "invalid Request/Transaction/Payment/Presentation tag (not present or [partially] empty)",
  },
  {
    code: "200.100.401",
    description:
      "invalid Request/Transaction/Account tag (not present or [partially] empty)",
  },
  {
    code: "200.100.402",
    description:
      "invalid Request/Transaction/Account(Customer, Relevance) tag (one of Account/Customer/Relevance must be present)",
  },
  {
    code: "200.100.403",
    description:
      "invalid Request/Transaction/Analysis tag (Criterions must have a name and value)",
  },
  {
    code: "200.100.404",
    description: "invalid Request/Transaction/Account (must not be present)",
  },
  { code: "200.100.501", description: "invalid or missing customer" },
  {
    code: "200.100.502",
    description:
      "invalid Request/Transaction/Customer/Name tag (not present or [partially] empty)",
  },
  {
    code: "200.100.503",
    description:
      "invalid Request/Transaction/Customer/Contact tag (not present or [partially] empty)",
  },
  {
    code: "200.100.504",
    description:
      "invalid Request/Transaction/Customer/Address tag (not present or [partially] empty)",
  },
  {
    code: "200.100.601",
    description:
      "invalid Request/Transaction/(ApplePay|GooglePay|SamsungPay) tag (not present or [partially] empty)",
  },
  {
    code: "200.100.602",
    description:
      "invalid Request/Transaction/(ApplePay|GooglePay|SamsungPay)/PaymentToken tag (not present or [partially] empty)",
  },
  {
    code: "200.100.603",
    description:
      "invalid Request/Transaction/(ApplePay|GooglePay|SamsungPay)/PaymentToken tag (decryption error)",
  },
  {
    code: "200.200.106",
    description: "duplicate transaction. Please verify that the UUID is unique",
  },
  { code: "200.300.403", description: "Invalid HTTP method" },
  { code: "200.300.404", description: "invalid or missing parameter" },
  { code: "200.300.405", description: "Duplicate entity" },
  { code: "200.300.406", description: "Entity not found" },
  { code: "200.300.407", description: "Entity not specific enough" },
  {
    code: "300.100.100",
    description:
      "Transaction declined (additional customer authentication required)",
  },
  {
    code: "500.100.201",
    description: "Channel/Merchant is disabled (no processing possible)",
  },
  {
    code: "500.100.202",
    description: "Channel/Merchant is new (no processing possible yet)",
  },
  {
    code: "500.100.203",
    description: "Channel/Merchant is closed (no processing possible)",
  },
  {
    code: "500.100.301",
    description: "Merchant-Connector is disabled (no processing possible)",
  },
  {
    code: "500.100.302",
    description: "Merchant-Connector is new (no processing possible yet)",
  },
  {
    code: "500.100.303",
    description: "Merchant-Connector is closed (no processing possible)",
  },
  {
    code: "500.100.304",
    description:
      "Merchant-Connector is disabled at gateway (no processing possible)",
  },
  {
    code: "500.100.401",
    description: "Connector is unavailable (no processing possible)",
  },
  {
    code: "500.100.402",
    description: "Connector is new (no processing possible yet)",
  },
  {
    code: "500.100.403",
    description: "Connector is unavailable (no processing possible)",
  },
  {
    code: "500.200.101",
    description: "No target account configured for DD transaction",
  },
  {
    code: "600.100.100",
    description: "Unexpected Integrator Error (Request could not be processed)",
  },
  { code: "600.200.100", description: "invalid Payment Method" },
  { code: "600.200.200", description: "Unsupported Payment Method" },
  {
    code: "600.200.201",
    description: "Channel/Merchant not configured for this payment method",
  },
  {
    code: "600.200.202",
    description: "Channel/Merchant not configured for this payment type",
  },
  { code: "600.200.300", description: "invalid Payment Type" },
  {
    code: "600.200.310",
    description: "invalid Payment Type for given Payment Method",
  },
  { code: "600.200.400", description: "Unsupported Payment Type" },
  {
    code: "600.200.500",
    description:
      "Invalid payment data. You are not configured for this currency or sub type (country or brand)",
  },
  {
    code: "600.200.501",
    description:
      "Invalid payment data for Recurring transaction. Merchant or transaction data has wrong recurring configuration.",
  },
  {
    code: "600.200.600",
    description: "invalid payment code (type or method)",
  },
  {
    code: "600.200.700",
    description:
      "invalid payment mode (you are not configured for the requested transaction mode)",
  },
  { code: "600.200.701", description: "testMode not allowed" },
  {
    code: "600.200.800",
    description:
      "invalid brand for given payment method and payment mode (you are not configured for the requested transaction mode)",
  },
  { code: "600.200.810", description: "invalid return code provided" },
  { code: "600.300.101", description: "Merchant key not found" },
  {
    code: "600.300.200",
    description: "merchant source IP address not whitelisted",
  },
  {
    code: "600.300.210",
    description: "merchant notificationUrl not whitelisted",
  },
  { code: "600.300.211", description: "shopperResultUrl not whitelisted" },
  { code: "700.100.100", description: "reference id does not exist" },
  { code: "700.100.200", description: "non matching reference amount" },
  { code: "700.100.300", description: "invalid amount (probably too large)" },
  {
    code: "700.100.400",
    description:
      "referenced payment method does not match with requested payment method",
  },
  {
    code: "700.100.500",
    description:
      "referenced payment currency does not match with requested payment currency",
  },
  {
    code: "700.100.600",
    description: "referenced mode does not match with requested payment mode",
  },
  {
    code: "700.100.700",
    description: "referenced transaction is of inappropriate type",
  },
  {
    code: "700.100.701",
    description:
      "referenced a DB transaction without explicitly providing an account. Not allowed to used referenced account.",
  },
  {
    code: "700.100.710",
    description: "cross-linkage of two transaction-trees",
  },
  {
    code: "700.300.100",
    description:
      "referenced tx can not be refunded, captured or reversed (invalid type)",
  },
  { code: "700.300.200", description: "referenced tx was rejected" },
  {
    code: "700.300.300",
    description:
      "referenced tx can not be refunded, captured or reversed (already refunded, captured or reversed)",
  },
  {
    code: "700.300.400",
    description: "referenced tx can not be captured (cut off time reached)",
  },
  {
    code: "700.300.500",
    description: "chargeback error (multiple chargebacks)",
  },
  {
    code: "700.300.600",
    description:
      "referenced tx can not be refunded or reversed (was chargebacked)",
  },
  {
    code: "700.300.700",
    description:
      "referenced tx can not be reversed (reversal not possible anymore)",
  },
  { code: "700.300.800", description: "referenced tx can not be voided" },
  {
    code: "700.400.000",
    description: "serious workflow error (call support)",
  },
  {
    code: "700.400.100",
    description:
      "cannot capture (PA value exceeded, PA reverted or invalid workflow?)",
  },
  {
    code: "700.400.101",
    description: "cannot capture (Not supported by authorization system)",
  },
  {
    code: "700.400.200",
    description:
      "cannot refund (refund volume exceeded or tx reversed or invalid workflow?)",
  },
  {
    code: "700.400.300",
    description:
      "cannot reverse (already refunded|reversed, invalid workflow or amount exceeded)",
  },
  {
    code: "700.400.400",
    description:
      "cannot chargeback (already chargebacked or invalid workflow?)",
  },
  {
    code: "700.400.402",
    description:
      "chargeback can only be generated internally by the payment system",
  },
  {
    code: "700.400.410",
    description:
      "cannot reversal chargeback (chargeback is already reversaled or invalid workflow?)",
  },
  {
    code: "700.400.411",
    description:
      "cannot reverse chargeback or invalid workflow (second chargeback)",
  },
  {
    code: "700.400.420",
    description:
      "cannot reversal chargeback (no chargeback existing or invalid workflow?)",
  },
  {
    code: "700.400.510",
    description:
      "capture needs at least one successful transaction of type (PA)",
  },
  {
    code: "700.400.520",
    description:
      "refund needs at least one successful transaction of type (CP or DB or RB or RC)",
  },
  {
    code: "700.400.530",
    description:
      "reversal needs at least one successful transaction of type (CP or DB or RB or PA)",
  },
  {
    code: "700.400.540",
    description:
      "reconceile needs at least one successful transaction of type (CP or DB or RB)",
  },
  {
    code: "700.400.550",
    description:
      "chargeback needs at least one successful transaction of type (CP or DB or RB)",
  },
  {
    code: "700.400.560",
    description:
      "receipt needs at least one successful transaction of type (PA or CP or DB or RB)",
  },
  {
    code: "700.400.561",
    description:
      "receipt on a registration needs a successfull registration in state 'OPEN'",
  },
  {
    code: "700.400.562",
    description:
      "receipts are configured to be generated only internally by the payment system",
  },
  {
    code: "700.400.565",
    description:
      "finalize needs at least one successful transaction of type (PA or DB)",
  },
  {
    code: "700.400.570",
    description: "cannot reference a waiting/pending transaction",
  },
  { code: "700.400.580", description: "cannot find transaction" },
  {
    code: "700.400.590",
    description:
      "installment needs at least one successful transaction of type (DB or PA)",
  },
  {
    code: "700.400.600",
    description:
      "finalize needs at least one successful transaction of type (IN, DB, PA or CD)",
  },
  {
    code: "700.400.700",
    description: "initial and referencing channel-ids do not match",
  },
  {
    code: "700.450.001",
    description: "cannot transfer money from one account to the same account",
  },
  {
    code: "700.500.001",
    description: "referenced session contains too many transactions",
  },
  {
    code: "700.500.002",
    description:
      "capture or preauthorization appears too late in referenced session",
  },
  {
    code: "700.500.003",
    description: "test accounts not allowed in production",
  },
  {
    code: "700.500.004",
    description:
      "cannot refer a transaction which contains deleted customer information",
  },
  {
    code: "800.100.100",
    description: "transaction declined for unknown reason",
  },
  {
    code: "800.100.150",
    description: "transaction declined (refund on gambling tx not allowed)",
  },
  { code: "800.100.151", description: "transaction declined (invalid card)" },
  {
    code: "800.100.152",
    description: "transaction declined by authorization system",
  },
  { code: "800.100.153", description: "transaction declined (invalid CVV)" },
  {
    code: "800.100.154",
    description: "transaction declined (transaction marked as invalid)",
  },
  {
    code: "800.100.155",
    description: "transaction declined (amount exceeds credit)",
  },
  { code: "800.100.156", description: "transaction declined (format error)" },
  {
    code: "800.100.157",
    description: "transaction declined (wrong expiry date)",
  },
  {
    code: "800.100.158",
    description: "transaction declined (suspecting manipulation)",
  },
  { code: "800.100.159", description: "transaction declined (stolen card)" },
  { code: "800.100.160", description: "transaction declined (card blocked)" },
  {
    code: "800.100.161",
    description: "transaction declined (too many invalid tries)",
  },
  {
    code: "800.100.162",
    description: "transaction declined (limit exceeded)",
  },
  {
    code: "800.100.163",
    description:
      "transaction declined (maximum transaction frequency exceeded)",
  },
  {
    code: "800.100.164",
    description: "transaction declined (merchants limit exceeded)",
  },
  { code: "800.100.165", description: "transaction declined (card lost)" },
  {
    code: "800.100.166",
    description:
      "transaction declined (Incorrect personal identification number)",
  },
  {
    code: "800.100.167",
    description:
      "transaction declined (referencing transaction does not match)",
  },
  {
    code: "800.100.168",
    description: "transaction declined (restricted card)",
  },
  {
    code: "800.100.169",
    description:
      "transaction declined (card type is not processed by the authorization center)",
  },
  {
    code: "800.100.170",
    description: "transaction declined (transaction not permitted)",
  },
  { code: "800.100.171", description: "transaction declined (pick up card)" },
  {
    code: "800.100.172",
    description: "transaction declined (account blocked)",
  },
  {
    code: "800.100.173",
    description:
      "transaction declined (invalid currency, not processed by authorization center)",
  },
  {
    code: "800.100.174",
    description: "transaction declined (invalid amount)",
  },
  {
    code: "800.100.175",
    description: "transaction declined (invalid brand)",
  },
  {
    code: "800.100.176",
    description:
      "transaction declined (account temporarily not available. Please try again later)",
  },
  {
    code: "800.100.177",
    description: "transaction declined (amount field should not be empty)",
  },
  {
    code: "800.100.178",
    description: "transaction declined (PIN entered incorrectly too often)",
  },
  {
    code: "800.100.179",
    description: "transaction declined (exceeds withdrawal count limit)",
  },
  {
    code: "800.100.190",
    description: "transaction declined (invalid configuration data)",
  },
  {
    code: "800.100.191",
    description:
      "transaction declined (transaction in wrong state on aquirer side)",
  },
  {
    code: "800.100.192",
    description:
      "transaction declined (invalid CVV, Amount has still been reserved on the customer's card and will be released in a few business days. Please ensure the CVV code is accurate before retrying the transaction)",
  },
  {
    code: "800.100.195",
    description: "transaction declined (UserAccount Number/ID unknown)",
  },
  {
    code: "800.100.196",
    description: "transaction declined (registration error)",
  },
  {
    code: "800.100.197",
    description: "transaction declined (registration cancelled externally)",
  },
  {
    code: "800.100.198",
    description: "transaction declined (invalid holder)",
  },
  {
    code: "800.100.199",
    description: "transaction declined (invalid tax number)",
  },
  {
    code: "800.100.200",
    description: "Refer to Payer due to reason not specified",
  },
  { code: "800.100.201", description: "Account or Bank Details Incorrect" },
  { code: "800.100.202", description: "Account Closed" },
  { code: "800.100.203", description: "Insufficient Funds" },
  { code: "800.100.204", description: "Mandate Expired" },
  { code: "800.100.205", description: "Mandate Discarded" },
  {
    code: "800.100.206",
    description: "Refund of an authorized payment requested by the customer",
  },
  { code: "800.100.207", description: "Refund requested" },
  {
    code: "800.100.208",
    description: "Direct debit not enabled for the specified account or bank",
  },
  {
    code: "800.100.300",
    description: "Network token transaction declined (the PAN data is invalid)",
  },
  {
    code: "800.100.301",
    description:
      "Network token transaction declined (the issuer considers the PAN as not eligible for tokenization)",
  },
  {
    code: "800.100.302",
    description:
      "Network token transaction declined (the issuer declined the tokenization)",
  },
  {
    code: "800.100.303",
    description:
      "Network token transaction declined (session timeout expired with card scheme)",
  },
  {
    code: "800.100.304",
    description:
      "Network token transaction declined (card scheme not identified or supported)",
  },
  {
    code: "800.100.305",
    description:
      "Network token transaction declined (merchant id wrong or merchant not onboarded)",
  },
  {
    code: "800.100.306",
    description:
      "Network token transaction declined (data cannot be decrypted)",
  },
  {
    code: "800.100.307",
    description:
      "Network token transaction declined (invalid network token state - operation not allowed)",
  },
  {
    code: "800.100.308",
    description:
      "Network token transaction declined (request cannot be verified by the card scheme)",
  },
  {
    code: "800.100.309",
    description:
      "Network token transaction declined (aborted by the card scheme)",
  },
  {
    code: "800.100.310",
    description: "Network token transaction declined (unknown reason)",
  },
  {
    code: "800.100.311",
    description:
      "Network token transaction declined (network token request in-flight)",
  },
  {
    code: "800.100.312",
    description:
      "Network token transaction declined (network token not available but requested)",
  },
  {
    code: "800.100.313",
    description:
      "Network token transaction declined (insufficient data to request a network token)",
  },
  {
    code: "800.100.314",
    description:
      "Network token transaction declined (network token already exists)",
  },
  {
    code: "800.100.315",
    description:
      "Network token transaction declined (required field not present)",
  },
  {
    code: "800.100.316",
    description:
      "Network token transaction declined (not processed - token vault configuration error)",
  },
  {
    code: "800.100.317",
    description: "Network token transaction declined (suspended network token)",
  },
  {
    code: "800.100.318",
    description:
      "Network token transaction declined (at least one transaction with cryptogram required)",
  },
  {
    code: "800.100.320",
    description:
      "Network token transaction declined (token service provider non retryable generic error)",
  },
  {
    code: "800.100.321",
    description:
      "Network token transaction declined (token service provider retryable generic error)",
  },
  {
    code: "800.100.322",
    description:
      "Network token transaction declined (card scheme retryable generic error)",
  },
  {
    code: "800.100.323",
    description:
      "Network token transaction declined (card scheme non retryable generic error)",
  },
  {
    code: "800.100.324",
    description: "Network token transaction declined (format error)",
  },
  {
    code: "800.100.325",
    description: "Network token transaction declined (unauthorized)",
  },
  {
    code: "800.100.326",
    description: "Network token transaction declined (network token not found)",
  },
  {
    code: "800.100.327",
    description: "Network token transaction declined (too many requests)",
  },
  {
    code: "800.100.330",
    description: "Network token transaction declined (network token expired)",
  },
  { code: "800.100.402", description: "cc/bank account holder not valid" },
  {
    code: "800.100.403",
    description: "transaction declined (revocation of authorisation order)",
  },
  {
    code: "800.100.500",
    description:
      "Card holder has advised his bank to stop this recurring payment",
  },
  {
    code: "800.100.501",
    description:
      "Card holder has advised his bank to stop all recurring payments for this merchant",
  },
  { code: "800.110.100", description: "duplicate transaction" },
  { code: "800.120.100", description: "Rejected by Throttling." },
  {
    code: "800.120.101",
    description: "maximum number of transactions per account already exceeded",
  },
  {
    code: "800.120.102",
    description: "maximum number of transactions per ip already exceeded",
  },
  {
    code: "800.120.103",
    description: "maximum number of transactions per email already exceeded",
  },
  {
    code: "800.120.200",
    description: "maximum total volume of transactions already exceeded",
  },
  {
    code: "800.120.201",
    description:
      "maximum total volume of transactions per account already exceeded",
  },
  {
    code: "800.120.202",
    description: "maximum total volume of transactions per ip already exceeded",
  },
  {
    code: "800.120.203",
    description:
      "maximum total volume of transactions per email already exceeded",
  },
  { code: "800.120.300", description: "chargeback rate per bin exceeded" },
  {
    code: "800.120.401",
    description:
      "maximum number of transactions or total volume for configured MIDs or CIs exceeded",
  },
  { code: "800.120.402", description: "Payment already processing." },
  {
    code: "800.121.100",
    description:
      "Channel not configured for given source type. Please contact your account manager.",
  },
  {
    code: "800.121.200",
    description:
      "Secure Query is not enabled for this entity. Please contact your account manager.",
  },
  {
    code: "800.121.300",
    description:
      "SMS is not enabled for this entity. Please contact your account manager.",
  },
  {
    code: "800.121.400",
    description:
      "Marketplace Payments is not enabled. Please contact your account manager.",
  },
  {
    code: "800.130.100",
    description: "Transaction with same TransactionId already exists",
  },
  {
    code: "800.140.100",
    description: "maximum number of registrations per mobile number exceeded",
  },
  {
    code: "800.140.101",
    description: "maximum number of registrations per email address exceeded",
  },
  {
    code: "800.140.110",
    description:
      "maximum number of registrations of mobile per credit card number exceeded",
  },
  {
    code: "800.140.111",
    description:
      "maximum number of registrations of credit card number per mobile exceeded",
  },
  {
    code: "800.140.112",
    description:
      "maximum number of registrations of email per credit card number exceeded",
  },
  {
    code: "800.140.113",
    description:
      "maximum number of registrations of credit card number per email exceeded",
  },
  {
    code: "800.150.100",
    description: "Account Holder does not match Customer Name",
  },
  {
    code: "800.160.100",
    description: "Invalid payment data for configured Shopper Dispatching Type",
  },
  {
    code: "800.160.110",
    description: "Invalid payment data for configured Payment Dispatching Type",
  },
  {
    code: "800.160.120",
    description:
      "Invalid payment data for configured Recurring Transaction Dispatching Type",
  },
  {
    code: "800.160.130",
    description:
      "Invalid payment data for configured TicketSize Dispatching Type",
  },
  {
    code: "800.200.159",
    description: "account or user is blacklisted (card stolen)",
  },
  {
    code: "800.200.160",
    description: "account or user is blacklisted (card blocked)",
  },
  {
    code: "800.200.165",
    description: "account or user is blacklisted (card lost)",
  },
  {
    code: "800.200.202",
    description: "account or user is blacklisted (account closed)",
  },
  {
    code: "800.200.208",
    description: "account or user is blacklisted (account blocked)",
  },
  {
    code: "800.200.220",
    description: "account or user is blacklisted (fraudulent transaction)",
  },
  { code: "800.300.101", description: "account or user is blacklisted" },
  { code: "800.300.102", description: "country blacklisted" },
  { code: "800.300.200", description: "email is blacklisted" },
  { code: "800.300.301", description: "ip blacklisted" },
  { code: "800.300.302", description: "ip is anonymous proxy" },
  { code: "800.300.401", description: "bin blacklisted" },
  {
    code: "800.300.500",
    description:
      "transaction temporary blacklisted (too many tries invalid CVV)",
  },
  {
    code: "800.300.501",
    description:
      "transaction temporary blacklisted (too many tries invalid expire date)",
  },
  { code: "800.310.200", description: "Account closed" },
  { code: "800.310.210", description: "Account not found" },
  {
    code: "800.310.211",
    description: "Account not found (BIN/issuer not participating)",
  },
  { code: "800.400.100", description: "AVS Check Failed" },
  { code: "800.400.101", description: "Mismatch of AVS street value" },
  { code: "800.400.102", description: "Mismatch of AVS street number" },
  { code: "800.400.103", description: "Mismatch of AVS PO box value fatal" },
  {
    code: "800.400.104",
    description: "Mismatch of AVS zip code value fatal",
  },
  {
    code: "800.400.105",
    description:
      "Mismatch of AVS settings (AVSkip, AVIgnore, AVSRejectPolicy) value",
  },
  {
    code: "800.400.110",
    description:
      "AVS Check Failed. Amount has still been reserved on the customer's card and will be released in a few business days. Please ensure the billing address is accurate before retrying the transaction.",
  },
  { code: "800.400.150", description: "Implausible address data" },
  { code: "800.400.151", description: "Implausible address state data" },
  {
    code: "800.400.200",
    description: "Invalid Payer Authentication in 3DSecure transaction",
  },
  {
    code: "800.400.500",
    description:
      "Waiting for confirmation of non-instant payment. Denied for now.",
  },
  {
    code: "800.400.501",
    description:
      "Waiting for confirmation of non-instant debit. Denied for now.",
  },
  {
    code: "800.400.502",
    description:
      "Waiting for confirmation of non-instant refund. Denied for now.",
  },
  {
    code: "800.500.100",
    description: "direct debit transaction declined for unknown reason",
  },
  {
    code: "800.500.110",
    description:
      "Unable to process transaction - ran out of terminalIds - please contact acquirer",
  },
  {
    code: "800.600.100",
    description: "transaction is being already processed",
  },
  {
    code: "800.700.100",
    description:
      "transaction for the same session is currently being processed, please try again later.",
  },
  { code: "800.700.101", description: "family name too long" },
  { code: "800.700.201", description: "given name too long" },
  { code: "800.700.500", description: "company name too long" },
  { code: "800.800.102", description: "Invalid street" },
  { code: "800.800.202", description: "Invalid zip" },
  { code: "800.800.302", description: "Invalid city" },
  {
    code: "800.800.400",
    description: "Connector/acquirer system is under maintenance",
  },
  {
    code: "800.800.800",
    description:
      "The payment system is currenty unavailable, please contact support in case this happens again.",
  },
  {
    code: "800.800.801",
    description:
      "The payment system is currenty unter maintenance. Please apologize for the inconvenience this may cause. If you were not informed of this maintenance window in advance, contact your sales representative.",
  },
  { code: "800.900.100", description: "sender authorization failed " },
  {
    code: "800.900.101",
    description: "invalid email address (probably invalid syntax)",
  },
  {
    code: "800.900.200",
    description:
      "invalid phone number (has to start with a digit or a '+', at least 7 and max 25 chars long)",
  },
  { code: "800.900.201", description: "unknown channel" },
  { code: "800.900.300", description: "invalid authentication information" },
  {
    code: "800.900.301",
    description:
      "user authorization failed, user has no sufficient rights to process transaction",
  },
  { code: "800.900.302", description: "Authorization failed" },
  { code: "800.900.303", description: "No token created" },
  { code: "800.900.399", description: "Secure Registration Problem" },
  { code: "800.900.401", description: "Invalid IP number" },
  { code: "800.900.450", description: "Invalid birthdate" },
  {
    code: "900.100.100",
    description: "unexpected communication error with connector/acquirer",
  },
  {
    code: "900.100.200",
    description: "error response from connector/acquirer",
  },
  {
    code: "900.100.201",
    description:
      "error on the external gateway (e.g. on the part of the bank, acquirer,...)",
  },
  {
    code: "900.100.202",
    description:
      "invalid transaction flow, the requested function is not applicable for the referenced transaction.",
  },
  { code: "900.100.203", description: "error on the internal gateway" },
  { code: "900.100.204", description: "Error during message parsing" },
  { code: "900.100.205", description: "Error response from token vault" },
  { code: "900.100.300", description: "timeout, uncertain result" },
  {
    code: "900.100.301",
    description:
      "Transaction timed out without response from connector/acquirer. It was reversed.",
  },
  {
    code: "900.100.310",
    description:
      "Transaction timed out due to internal system misconfiguration. Request to acquirer has not been sent.",
  },
  { code: "900.100.400", description: "timeout at connectors/acquirer side" },
  {
    code: "900.100.500",
    description: "timeout at connectors/acquirer side (try later)",
  },
  { code: "900.100.600", description: "connector/acquirer currently down" },
  {
    code: "900.100.700",
    description: "error on the external service provider",
  },
  {
    code: "900.200.100",
    description: "Message Sequence Number of Connector out of sync",
  },
  { code: "900.300.600", description: "user session timeout" },
  {
    code: "900.400.100",
    description: "unexpected communication error with external risk provider",
  },
  { code: "999.999.888", description: "UNDEFINED PLATFORM DATABASE ERROR" },
  { code: "999.999.999", description: "UNDEFINED CONNECTOR/ACQUIRER ERROR" },
];
const hyperpayArabicResultCodes = [
  { code: "000.000.000", description: "Transaction succeeded" },
  { code: "000.000.100", description: "successful request" },
  {
    code: "000.100.105",
    description: "Chargeback Representment is successful",
  },
  {
    code: "000.100.106",
    description: "Chargeback Representment cancellation is successful",
  },
  {
    code: "000.100.110",
    description:
      "Request successfully processed in 'Merchant in Integrator Test Mode'",
  },
  {
    code: "000.100.111",
    description:
      "Request successfully processed in 'Merchant in Validator Test Mode'",
  },
  {
    code: "000.100.112",
    description:
      "Request successfully processed in 'Merchant in Connector Test Mode'",
  },
  { code: "000.100.200", description: "Reason not Specified" },
  { code: "000.100.201", description: "Account or Bank Details Incorrect" },
  { code: "000.100.202", description: "Account Closed" },
  { code: "000.100.203", description: "Insufficient Funds" },
  { code: "000.100.204", description: "Mandate not Valid" },
  { code: "000.100.205", description: "Mandate Cancelled" },
  { code: "000.100.206", description: "Revocation or Dispute" },
  { code: "000.100.207", description: "Cancellation in Clearing Network" },
  { code: "000.100.208", description: "Account Blocked" },
  { code: "000.100.209", description: "Account does not exist" },
  { code: "000.100.210", description: "Invalid Amount" },
  {
    code: "000.100.211",
    description:
      "Transaction succeeded (amount of transaction is smaller then amount of pre-authorization)",
  },
  {
    code: "000.100.212",
    description:
      "Transaction succeeded (amount of transaction is greater then amount of pre-authorization)",
  },
  { code: "000.100.220", description: "Fraudulent Transaction" },
  { code: "000.100.221", description: "Merchandise Not Received" },
  {
    code: "000.100.222",
    description: "Transaction Not Recognized By Cardholder",
  },
  { code: "000.100.223", description: "Service Not Rendered" },
  { code: "000.100.224", description: "Duplicate Processing" },
  { code: "000.100.225", description: "Credit Not Processed" },
  { code: "000.100.226", description: "Cannot be settled" },
  { code: "000.100.227", description: "Configuration Issue" },
  {
    code: "000.100.228",
    description: "Temporary Communication Error - Retry",
  },
  { code: "000.100.229", description: "Incorrect Instructions" },
  { code: "000.100.230", description: "Unauthorised Charge" },
  { code: "000.100.231", description: "Late Representment" },
  { code: "000.100.232", description: "Liability Shift" },
  { code: "000.100.233", description: "Authorization-Related Chargeback" },
  { code: "000.100.234", description: "Non receipt of merchandise" },
  { code: "000.100.299", description: "Unspecified (Technical)" },
  { code: "000.200.000", description: "transaction pending" },
  {
    code: "000.200.001",
    description:
      "Transaction pending for acquirer, the consumer is not present",
  },
  { code: "000.200.100", description: "successfully created checkout" },
  { code: "000.200.101", description: "successfully updated checkout" },
  { code: "000.200.102", description: "successfully deleted checkout" },
  { code: "000.200.103", description: "checkout is pending" },
  { code: "000.200.200", description: "Transaction initialized" },
  {
    code: "000.200.201",
    description:
      "QR Scanned/Link Clicked, waiting for the final authentication result",
  },
  { code: "000.200.999", description: "Token Vault usage disabled" },
  { code: "000.300.000", description: "Two-step transaction succeeded" },
  { code: "000.300.100", description: "Risk check successful" },
  { code: "000.300.101", description: "Risk bank account check successful" },
  { code: "000.300.102", description: "Risk report successful" },
  { code: "000.300.103", description: "Exemption check successful" },
  { code: "000.310.100", description: "Account updated" },
  {
    code: "000.310.101",
    description: "Account updated (Credit card expired)",
  },
  {
    code: "000.310.110",
    description: "No updates found, but account is valid",
  },
  {
    code: "000.400.000",
    description:
      "Transaction succeeded (please review manually due to fraud suspicion)",
  },
  {
    code: "000.400.010",
    description:
      "Transaction succeeded (please review manually due to AVS return code)",
  },
  {
    code: "000.400.020",
    description:
      "Transaction succeeded (please review manually due to CVV return code)",
  },
  {
    code: "000.400.030",
    description:
      "Transaction partially failed (please reverse manually due to failed automatic reversal)",
  },
  {
    code: "000.400.040",
    description:
      "Transaction succeeded (please review manually due to amount mismatch)",
  },
  {
    code: "000.400.050",
    description:
      "Transaction succeeded (please review manually because transaction is pending)",
  },
  {
    code: "000.400.060",
    description: "Transaction succeeded (approved at merchant's risk)",
  },
  {
    code: "000.400.070",
    description: "Transaction succeeded (waiting for external risk review)",
  },
  {
    code: "000.400.080",
    description:
      "Transaction succeeded (please review manually because the service was unavailable)",
  },
  {
    code: "000.400.081",
    description:
      "Transaction succeeded (please review manually, as the risk status not available yet due network timeout)",
  },
  {
    code: "000.400.082",
    description:
      "Transaction succeeded (please review manually, as the risk status not available yet due processing timeout)",
  },
  {
    code: "000.400.090",
    description:
      "Transaction succeeded (please review manually due to external risk check)",
  },
  {
    code: "000.400.100",
    description: "Transaction succeeded, risk after payment rejected",
  },
  {
    code: "000.400.101",
    description: "card not participating/authentication unavailable",
  },
  { code: "000.400.102", description: "user not enrolled" },
  { code: "000.400.103", description: "Technical Error in 3D system" },
  {
    code: "000.400.104",
    description: "Missing or malformed 3DSecure Configuration for Channel",
  },
  {
    code: "000.400.105",
    description: "Unsupported User Device - Authentication not possible",
  },
  {
    code: "000.400.106",
    description:
      "invalid payer authentication response(PARes) in 3DSecure Transaction",
  },
  {
    code: "000.400.107",
    description: "Communication Error to Scheme Directory Server",
  },
  {
    code: "000.400.108",
    description:
      "Cardholder Not Found - card number provided is not found in the ranges of the issuer",
  },
  {
    code: "000.400.109",
    description: "Card is not enrolled for 3DS version 2",
  },
  {
    code: "000.400.110",
    description: "Authentication successful (frictionless flow)",
  },
  { code: "000.400.111", description: "Data Only request failed" },
  { code: "000.400.112", description: "3RI transaction not permitted" },
  {
    code: "000.400.113",
    description: "Protocol version not supported by the issuer ACS",
  },
  {
    code: "000.400.120",
    description: "Authentication successful (data only flow)",
  },
  {
    code: "000.400.200",
    description: "risk management check communication error",
  },
  {
    code: "000.500.000",
    description: "Transaction succeeded - very good rating",
  },
  {
    code: "000.500.100",
    description: "Transaction succeeded (address corrected)",
  },
  {
    code: "000.600.000",
    description: "transaction succeeded due to external update",
  },
  {
    code: "100.100.100",
    description:
      "request contains no creditcard, bank account number or bank name",
  },
  {
    code: "100.100.101",
    description: "invalid creditcard, bank account number or bank name",
  },
  { code: "100.100.104", description: "invalid unique id / root unique id" },
  { code: "100.100.200", description: "request contains no month" },
  { code: "100.100.201", description: "invalid month" },
  { code: "100.100.300", description: "request contains no year" },
  { code: "100.100.301", description: "invalid year" },
  { code: "100.100.303", description: "card expired" },
  { code: "100.100.304", description: "card not yet valid" },
  { code: "100.100.305", description: "invalid expiration date format" },
  {
    code: "100.100.400",
    description: "request contains no cc/bank account holder",
  },
  {
    code: "100.100.401",
    description: "cc/bank account holder too short or too long",
  },
  { code: "100.100.402", description: "cc/bank account holder not valid" },
  {
    code: "100.100.500",
    description: "request contains no credit card brand",
  },
  { code: "100.100.501", description: "invalid credit card brand" },
  {
    code: "100.100.600",
    description: "empty CVV for VISA,MASTER, AMEX not allowed",
  },
  { code: "100.100.601", description: "invalid CVV/brand combination" },
  {
    code: "100.100.650",
    description: "empty CreditCardIssueNumber for MAESTRO not allowed",
  },
  { code: "100.100.651", description: "invalid CreditCardIssueNumber" },
  { code: "100.100.700", description: "invalid cc number/brand combination" },
  {
    code: "100.100.701",
    description: "suspecting fraud, this card may not be processed",
  },
  {
    code: "100.150.100",
    description: "request contains no Account data and no registration id",
  },
  {
    code: "100.150.101",
    description:
      "invalid format for specified registration id (must be uuid format)",
  },
  { code: "100.150.200", description: "registration does not exist" },
  { code: "100.150.201", description: "registration is not confirmed yet" },
  {
    code: "100.150.202",
    description: "registration is already deregistered",
  },
  {
    code: "100.150.203",
    description: "registration is not valid, probably initially rejected",
  },
  {
    code: "100.150.204",
    description:
      "account registration reference pointed to no registration transaction",
  },
  {
    code: "100.150.205",
    description: "referenced registration does not contain an account",
  },
  { code: "100.150.206", description: "Retention period expired" },
  {
    code: "100.150.300",
    description: "payment only allowed with valid initial registration",
  },
  {
    code: "100.200.100",
    description: "bank account contains no or invalid country",
  },
  {
    code: "100.200.103",
    description:
      "bank account has invalid bankcode/name account number combination",
  },
  {
    code: "100.200.104",
    description: "bank account has invalid acccount number format",
  },
  {
    code: "100.200.200",
    description:
      "bank account needs to be registered and confirmed first. Country is mandate based.",
  },
  {
    code: "100.210.101",
    description: "virtual account contains no or invalid Id",
  },
  {
    code: "100.210.102",
    description: "virtual account contains no or invalid brand",
  },
  {
    code: "100.211.101",
    description: "user account contains no or invalid Id",
  },
  {
    code: "100.211.102",
    description: "user account contains no or invalid brand",
  },
  {
    code: "100.211.103",
    description: "no password defined for user account",
  },
  {
    code: "100.211.104",
    description:
      "password does not meet safety requirements (needs 8 digits at least and must contain letters and numbers)",
  },
  {
    code: "100.211.105",
    description: "wallet id has to be a valid email address",
  },
  { code: "100.211.106", description: "voucher ids have 32 digits always" },
  {
    code: "100.212.101",
    description: "wallet account registration must not have an initial balance",
  },
  {
    code: "100.212.102",
    description: "wallet account contains no or invalid brand",
  },
  {
    code: "100.212.103",
    description:
      "wallet account payment transaction needs to reference a registration",
  },
  {
    code: "100.250.100",
    description: "job contains no execution information",
  },
  { code: "100.250.105", description: "invalid or missing action type" },
  { code: "100.250.106", description: "invalid or missing duration unit" },
  { code: "100.250.107", description: "invalid or missing notice unit" },
  { code: "100.250.110", description: "missing job execution" },
  { code: "100.250.111", description: "missing job expression" },
  {
    code: "100.250.120",
    description:
      "invalid execution parameters, combination does not conform to standard",
  },
  {
    code: "100.250.121",
    description: "invalid execution parameters, hour must be between 0 and 23",
  },
  {
    code: "100.250.122",
    description:
      "invalid execution parameters, minute and seconds must be between 0 and 59",
  },
  {
    code: "100.250.123",
    description:
      "invalid execution parameters, Day of month must be between 1 and 31",
  },
  {
    code: "100.250.124",
    description: "invalid execution parameters, month must be between 1 and 12",
  },
  {
    code: "100.250.125",
    description:
      "invalid execution parameters, Day of week must be between 1 and 7",
  },
  { code: "100.250.250", description: "Job tag missing" },
  {
    code: "100.300.101",
    description:
      "invalid test mode (please use LIVE or INTEGRATOR_TEST or CONNECTOR_TEST)",
  },
  { code: "100.300.200", description: "transaction id too long" },
  { code: "100.300.300", description: "invalid reference id" },
  { code: "100.300.400", description: "missing or invalid channel id" },
  { code: "100.300.401", description: "missing or invalid sender id" },
  { code: "100.300.402", description: "missing or invalid version" },
  { code: "100.300.501", description: "invalid response id" },
  { code: "100.300.600", description: "invalid or missing user login" },
  { code: "100.300.601", description: "invalid or missing user pwd" },
  { code: "100.300.700", description: "invalid relevance" },
  {
    code: "100.300.701",
    description: "invalid relevance for given payment type",
  },
  {
    code: "100.310.401",
    description: "Account management type not supported",
  },
  {
    code: "100.310.402",
    description: "Account management transaction not allowed in current state",
  },
  {
    code: "100.350.100",
    description: "referenced session is REJECTED (no action possible).",
  },
  {
    code: "100.350.101",
    description: "referenced session is CLOSED (no action possible)",
  },
  { code: "100.350.200", description: "undefined session state" },
  {
    code: "100.350.201",
    description:
      "referencing a registration through reference id is not applicable for this payment type",
  },
  {
    code: "100.350.301",
    description: "confirmation (CF) must be registered (RG) first",
  },
  { code: "100.350.302", description: "session already confirmed (CF)" },
  {
    code: "100.350.303",
    description: "cannot deregister (DR) unregistered account and/or customer",
  },
  { code: "100.350.310", description: "cannot confirm (CF) session via XML" },
  {
    code: "100.350.311",
    description: "cannot confirm (CF) on a registration passthrough channel",
  },
  {
    code: "100.350.312",
    description: "cannot do passthrough on non-internal connector",
  },
  {
    code: "100.350.313",
    description: "registration of this type has to provide confirmation url",
  },
  {
    code: "100.350.314",
    description:
      "customer could not be notified of pin to confirm registration (channel)",
  },
  {
    code: "100.350.315",
    description:
      "customer could not be notified of pin to confirm registration (sending failed)",
  },
  {
    code: "100.350.316",
    description: "cannot extend the token (TE) on unregistered account",
  },
  {
    code: "100.350.400",
    description:
      "no or invalid PIN (email/SMS/MicroDeposit authentication) entered",
  },
  {
    code: "100.350.500",
    description:
      "unable to obtain personal (virtual) account - most likely no more accounts available",
  },
  {
    code: "100.350.601",
    description: "registration is not allowed to reference another transaction",
  },
  {
    code: "100.350.602",
    description: "Registration is not allowed for recurring payment migration",
  },
  { code: "100.360.201", description: "unknown schedule type" },
  { code: "100.360.300", description: "cannot schedule(SD) unscheduled job" },
  {
    code: "100.360.303",
    description: "cannot deschedule(DS) unscheduled job",
  },
  {
    code: "100.360.400",
    description: "schedule module not configured for LIVE transaction mode",
  },
  { code: "100.370.100", description: "transaction declined" },
  {
    code: "100.370.101",
    description: "responseUrl not set in Transaction/Frontend",
  },
  {
    code: "100.370.102",
    description: "malformed responseUrl in Transaction/Frontend",
  },
  {
    code: "100.370.110",
    description: "transaction must be executed for German address",
  },
  {
    code: "100.370.111",
    description: "system error( possible incorrect/missing input data)",
  },
  {
    code: "100.370.121",
    description: "no or unknown ECI Type defined in Authentication",
  },
  {
    code: "100.370.122",
    description: "parameter with null key provided in 3DSecure Authentication",
  },
  {
    code: "100.370.123",
    description:
      "no or unknown verification type defined in 3DSecure Authentication",
  },
  {
    code: "100.370.124",
    description: "unknown parameter key in 3DSecure Authentication",
  },
  {
    code: "100.370.125",
    description:
      "Invalid 3DSecure Verification_ID. Must have Base64 encoding a Length of 28 digits",
  },
  {
    code: "100.370.131",
    description:
      "no or unknown authentication type defined in Transaction/Authentication@type",
  },
  {
    code: "100.370.132",
    description:
      "no result indicator defined Transaction/Authentication/resultIndicator",
  },
  {
    code: "100.380.101",
    description: "transaction contains no risk management part",
  },
  {
    code: "100.380.201",
    description: "no risk management process type specified",
  },
  {
    code: "100.380.305",
    description:
      "no frontend information provided for asynchronous transaction",
  },
  {
    code: "100.380.306",
    description:
      "no authentication data provided in risk management transaction",
  },
  { code: "100.380.401", description: "User Authentication Failed" },
  { code: "100.380.501", description: "risk management transaction timeout" },
  { code: "100.390.100", description: "3D Secure transaction rejected" },
  { code: "100.390.101", description: "purchase amount/currency mismatch" },
  { code: "100.390.102", description: "PARes Validation failed" },
  {
    code: "100.390.103",
    description: "PARes Validation failed - problem with signature",
  },
  { code: "100.390.104", description: "XID mismatch" },
  {
    code: "100.390.105",
    description:
      "Transaction rejected because of technical error in 3DSecure system",
  },
  {
    code: "100.390.106",
    description:
      "Transaction rejected because of error in 3DSecure configuration",
  },
  {
    code: "100.390.107",
    description:
      "Transaction rejected because cardholder authentication unavailable",
  },
  {
    code: "100.390.108",
    description:
      "Transaction rejected because merchant not participating in 3DSecure program",
  },
  {
    code: "100.390.109",
    description:
      "Transaction rejected because of VISA status 'U' or AMEX status 'N' or 'U' in 3DSecure program",
  },
  {
    code: "100.390.110",
    description:
      "Cardholder Not Found - card number provided is not found in the ranges of the issuer",
  },
  {
    code: "100.390.111",
    description: "Communication Error to Scheme Directory Server",
  },
  { code: "100.390.112", description: "Technical Error in 3D system" },
  {
    code: "100.390.113",
    description: "Unsupported User Device - Authentication not possible",
  },
  {
    code: "100.390.114",
    description:
      "Not authenticated because the issuer is rejecting authentication",
  },
  {
    code: "100.390.115",
    description: "Authentication failed due to invalid message format",
  },
  {
    code: "100.390.116",
    description: "Access denied to the authentication system",
  },
  {
    code: "100.390.117",
    description: "Authentication failed due to invalid data fields",
  },
  {
    code: "100.390.118",
    description: "Authentication failed due to suspected fraud",
  },
  {
    code: "100.390.119",
    description: "Exceeded maximum number of 3DS attempts",
  },
  { code: "100.390.120", description: "Non-payment transaction rejected" },
  { code: "100.390.121", description: "3RI transaction rejected" },
  { code: "100.390.122", description: "Decoupled authentication rejected" },
  {
    code: "100.390.123",
    description: "Exceeded maximum number of PReq messages",
  },
  {
    code: "100.390.124",
    description: "The authentication is cancelled or abandoned",
  },
  { code: "100.395.101", description: "Bank not supported for Giropay" },
  {
    code: "100.395.102",
    description: "Account not enabled for Giropay e.g. test account",
  },
  {
    code: "100.395.501",
    description: "Previously pending online transfer transaction timed out",
  },
  {
    code: "100.395.502",
    description:
      "Acquirer/Bank reported timeout on online transfer transaction",
  },
  { code: "100.396.101", description: "Cancelled by user" },
  { code: "100.396.102", description: "Not confirmed by user" },
  {
    code: "100.396.103",
    description: "Previously pending transaction timed out",
  },
  {
    code: "100.396.104",
    description: "Uncertain status - probably cancelled by user",
  },
  {
    code: "100.396.106",
    description: "User did not agree to payment method terms",
  },
  { code: "100.396.201", description: "Cancelled by merchant" },
  {
    code: "100.397.101",
    description: "Cancelled by user due to external update",
  },
  {
    code: "100.397.102",
    description: "Rejected by connector/acquirer due to external update",
  },
  {
    code: "100.400.000",
    description: "transaction declined (Wrong Address)",
  },
  {
    code: "100.400.001",
    description: "transaction declined (Wrong Identification)",
  },
  {
    code: "100.400.002",
    description: "transaction declined (Insufficient credibility score)",
  },
  {
    code: "100.400.005",
    description: "transaction must be executed for German address",
  },
  {
    code: "100.400.007",
    description: "System error ( possible incorrect/missing input data)",
  },
  { code: "100.400.020", description: "transaction declined" },
  { code: "100.400.021", description: "transaction declined for country" },
  {
    code: "100.400.030",
    description: "transaction not authorized. Please check manually",
  },
  {
    code: "100.400.039",
    description: "transaction declined for other error",
  },
  { code: "100.400.040", description: "authorization failure" },
  {
    code: "100.400.041",
    description: "transaction must be executed for German address",
  },
  {
    code: "100.400.042",
    description:
      "transaction declined by SCHUFA (Insufficient credibility score)",
  },
  {
    code: "100.400.043",
    description:
      "transaction declined because of missing obligatory parameter(s)",
  },
  {
    code: "100.400.044",
    description: "transaction not authorized. Please check manually",
  },
  {
    code: "100.400.045",
    description: "SCHUFA result not definite. Please check manually",
  },
  {
    code: "100.400.051",
    description: "SCHUFA system error (possible incorrect/missing input data)",
  },
  { code: "100.400.060", description: "authorization failure" },
  {
    code: "100.400.061",
    description: "transaction declined (Insufficient credibility score)",
  },
  {
    code: "100.400.063",
    description:
      "transaction declined because of missing obligatory parameter(s)",
  },
  {
    code: "100.400.064",
    description:
      "transaction must be executed for Austrian, German or Swiss address",
  },
  {
    code: "100.400.065",
    description: "result ambiguous. Please check manually",
  },
  {
    code: "100.400.071",
    description: "system error (possible incorrect/missing input data)",
  },
  { code: "100.400.080", description: "authorization failure" },
  { code: "100.400.081", description: "transaction declined" },
  {
    code: "100.400.083",
    description:
      "transaction declined because of missing obligatory parameter(s)",
  },
  {
    code: "100.400.084",
    description: "transaction can not be executed for given country",
  },
  {
    code: "100.400.085",
    description: "result ambiguous. Please check manually",
  },
  {
    code: "100.400.086",
    description: "transaction declined (Wrong Address)",
  },
  {
    code: "100.400.087",
    description: "transaction declined (Wrong Identification)",
  },
  {
    code: "100.400.091",
    description: "system error (possible incorrect/missing input data)",
  },
  {
    code: "100.400.100",
    description: "transaction declined - very bad rating",
  },
  { code: "100.400.120", description: "authorization failure" },
  { code: "100.400.121", description: "account blacklisted" },
  {
    code: "100.400.122",
    description: "transaction must be executed for valid German account",
  },
  {
    code: "100.400.123",
    description:
      "transaction declined because of missing obligatory parameter(s)",
  },
  {
    code: "100.400.130",
    description: "system error (possible incorrect/missing input data)",
  },
  {
    code: "100.400.139",
    description: "system error (possible incorrect/missing input data)",
  },
  { code: "100.400.140", description: "transaction declined by GateKeeper" },
  { code: "100.400.141", description: "Challenge by ReD Shield" },
  { code: "100.400.142", description: "Deny by ReD Shield" },
  { code: "100.400.143", description: "Noscore by ReD Shield" },
  { code: "100.400.144", description: "ReD Shield data error" },
  { code: "100.400.145", description: "ReD Shield connection error" },
  { code: "100.400.146", description: "Line item error by ReD Shield" },
  {
    code: "100.400.147",
    description: "Payment void and transaction denied by ReD Shield",
  },
  {
    code: "100.400.148",
    description: "Payment void and transaction challenged by ReD Shield",
  },
  {
    code: "100.400.149",
    description: "Payment void and data error by ReD Shield",
  },
  {
    code: "100.400.150",
    description: "Payment void and connection error by ReD Shield",
  },
  {
    code: "100.400.151",
    description: "Payment void and line item error by ReD Shield",
  },
  {
    code: "100.400.152",
    description: "Payment void and error returned by ReD Shield",
  },
  { code: "100.400.241", description: "Challenged by Threat Metrix" },
  { code: "100.400.242", description: "Denied by Threat Metrix" },
  { code: "100.400.243", description: "Invalid sessionId" },
  { code: "100.400.260", description: "authorization failure" },
  { code: "100.400.300", description: "abort checkout process" },
  { code: "100.400.301", description: "reenter age/birthdate" },
  {
    code: "100.400.302",
    description: "reenter address (packstation not allowed)",
  },
  { code: "100.400.303", description: "reenter address" },
  { code: "100.400.304", description: "invalid input data" },
  { code: "100.400.305", description: "invalid foreign address" },
  { code: "100.400.306", description: "delivery address error" },
  {
    code: "100.400.307",
    description: "offer only secure methods of payment",
  },
  {
    code: "100.400.308",
    description:
      "offer only secure methods of payment; possibly abort checkout",
  },
  {
    code: "100.400.309",
    description:
      "confirm corrected address; if not confirmed, offer secure methods of payment only",
  },
  {
    code: "100.400.310",
    description:
      "confirm bank account data; if not confirmed, offer secure methods of payment only",
  },
  { code: "100.400.311", description: "transaction declined (format error)" },
  {
    code: "100.400.312",
    description: "transaction declined (invalid configuration data)",
  },
  {
    code: "100.400.313",
    description: "currency field is invalid or missing",
  },
  { code: "100.400.314", description: "amount invalid or empty" },
  {
    code: "100.400.315",
    description: "invalid or missing email address (probably invalid syntax)",
  },
  { code: "100.400.316", description: "transaction declined (card missing)" },
  { code: "100.400.317", description: "transaction declined (invalid card)" },
  { code: "100.400.318", description: "invalid IP number" },
  { code: "100.400.319", description: "transaction declined by risk system" },
  {
    code: "100.400.320",
    description: "shopping cart data invalid or missing",
  },
  { code: "100.400.321", description: "payment type invalid or missing" },
  {
    code: "100.400.322",
    description: "encryption method invalid or missing",
  },
  { code: "100.400.323", description: "certificate invalid or missing" },
  { code: "100.400.324", description: "Error on the external risk system" },
  { code: "100.400.325", description: "External risk system not available" },
  {
    code: "100.400.326",
    description: "Risk bank account check unsuccessful",
  },
  { code: "100.400.327", description: "Risk report unsuccessful" },
  {
    code: "100.400.328",
    description: "Risk report unsuccessful (invalid data)",
  },
  { code: "100.400.500", description: "waiting for external risk" },
  { code: "100.500.101", description: "payment method invalid" },
  { code: "100.500.201", description: "payment type invalid" },
  { code: "100.500.301", description: "invalid due date" },
  { code: "100.500.302", description: "invalid mandate date of signature" },
  { code: "100.500.303", description: "invalid mandate id" },
  { code: "100.500.304", description: "invalid mandate external id" },
  {
    code: "100.550.300",
    description: "request contains no amount or too low amount",
  },
  { code: "100.550.301", description: "amount too large" },
  {
    code: "100.550.303",
    description: "amount format invalid (only two decimals allowed).",
  },
  {
    code: "100.550.310",
    description: "amount exceeds limit for the registered account.",
  },
  { code: "100.550.311", description: "exceeding account balance" },
  {
    code: "100.550.312",
    description: "Amount is outside allowed ticket size boundaries",
  },
  { code: "100.550.400", description: "request contains no currency" },
  { code: "100.550.401", description: "invalid currency" },
  { code: "100.550.601", description: "risk amount too large" },
  {
    code: "100.550.603",
    description: "risk amount format invalid (only two decimals allowed)",
  },
  {
    code: "100.550.605",
    description:
      "risk amount is smaller than amount (it must be equal or bigger then amount)",
  },
  { code: "100.550.701", description: "amounts not matched" },
  { code: "100.550.702", description: "currencies not matched" },
  { code: "100.600.500", description: "usage field too long" },
  { code: "100.700.100", description: "customer.surname may not be null" },
  {
    code: "100.700.101",
    description: "customer.surname length must be between 0 and 50",
  },
  { code: "100.700.200", description: "customer.givenName may not be null" },
  {
    code: "100.700.201",
    description: "customer.givenName length must be between 0 and 50",
  },
  { code: "100.700.300", description: "invalid salutation" },
  { code: "100.700.400", description: "invalid title" },
  { code: "100.700.500", description: "company name too long" },
  {
    code: "100.700.800",
    description: "identity contains no or invalid 'paper'",
  },
  {
    code: "100.700.801",
    description: "identity contains no or invalid identification value",
  },
  { code: "100.700.802", description: "identification value too long" },
  { code: "100.700.810", description: "specify at least one identity" },
  { code: "100.800.100", description: "request contains no street" },
  {
    code: "100.800.101",
    description:
      "The combination of street1 and street2 must not exceed 201 characters.",
  },
  {
    code: "100.800.102",
    description:
      "The combination of street1 and street2 must not contain only numbers.",
  },
  { code: "100.800.200", description: "request contains no zip" },
  { code: "100.800.201", description: "zip too long" },
  { code: "100.800.202", description: "invalid zip" },
  { code: "100.800.300", description: "request contains no city" },
  { code: "100.800.301", description: "city too long" },
  { code: "100.800.302", description: "invalid city" },
  { code: "100.800.400", description: "invalid state/country combination" },
  { code: "100.800.401", description: "state too long" },
  { code: "100.800.500", description: "request contains no country" },
  { code: "100.800.501", description: "invalid country" },
  { code: "100.900.100", description: "request contains no email address" },
  {
    code: "100.900.101",
    description: "invalid email address (probably invalid syntax)",
  },
  {
    code: "100.900.105",
    description: "email address too long (max 50 chars)",
  },
  {
    code: "100.900.200",
    description:
      "invalid phone number (has to start with a digit or a '+', at least 7 and max 25 chars long)",
  },
  {
    code: "100.900.300",
    description:
      "invalid mobile phone number (has to start with a digit or a '+', at least 7 and max 25 chars long)",
  },
  { code: "100.900.301", description: "mobile phone number mandatory" },
  { code: "100.900.400", description: "request contains no ip number" },
  { code: "100.900.401", description: "invalid ip number" },
  { code: "100.900.450", description: "invalid birthdate" },
  { code: "100.900.500", description: "invalid recurrence mode" },
  {
    code: "200.100.101",
    description:
      "invalid Request Message. No valid XML. XML must be url-encoded! maybe it contains a not encoded ampersand or something similar.",
  },
  {
    code: "200.100.102",
    description:
      "invalid Request. XML load missing (XML string must be sent within parameter 'load')",
  },
  {
    code: "200.100.103",
    description:
      "invalid Request Message. The request contains structural errors",
  },
  {
    code: "200.100.150",
    description:
      "transaction of multirequest not processed because of subsequent problems",
  },
  {
    code: "200.100.151",
    description:
      "multi-request is allowed with a maximum of 10 transactions only",
  },
  {
    code: "200.100.199",
    description:
      "Wrong Web Interface / URL used. Please check out the Tech Quick Start Doc Chapter 3.",
  },
  {
    code: "200.100.201",
    description:
      "invalid Request/Transaction tag (not present or [partially] empty)",
  },
  {
    code: "200.100.300",
    description:
      "invalid Request/Transaction/Payment tag (no or invalid code specified)",
  },
  {
    code: "200.100.301",
    description:
      "invalid Request/Transaction/Payment tag (not present or [partially] empty)",
  },
  {
    code: "200.100.302",
    description:
      "invalid Request/Transaction/Payment/Presentation tag (not present or [partially] empty)",
  },
  {
    code: "200.100.401",
    description:
      "invalid Request/Transaction/Account tag (not present or [partially] empty)",
  },
  {
    code: "200.100.402",
    description:
      "invalid Request/Transaction/Account(Customer, Relevance) tag (one of Account/Customer/Relevance must be present)",
  },
  {
    code: "200.100.403",
    description:
      "invalid Request/Transaction/Analysis tag (Criterions must have a name and value)",
  },
  {
    code: "200.100.404",
    description: "invalid Request/Transaction/Account (must not be present)",
  },
  { code: "200.100.501", description: "invalid or missing customer" },
  {
    code: "200.100.502",
    description:
      "invalid Request/Transaction/Customer/Name tag (not present or [partially] empty)",
  },
  {
    code: "200.100.503",
    description:
      "invalid Request/Transaction/Customer/Contact tag (not present or [partially] empty)",
  },
  {
    code: "200.100.504",
    description:
      "invalid Request/Transaction/Customer/Address tag (not present or [partially] empty)",
  },
  {
    code: "200.100.601",
    description:
      "invalid Request/Transaction/(ApplePay|GooglePay|SamsungPay) tag (not present or [partially] empty)",
  },
  {
    code: "200.100.602",
    description:
      "invalid Request/Transaction/(ApplePay|GooglePay|SamsungPay)/PaymentToken tag (not present or [partially] empty)",
  },
  {
    code: "200.100.603",
    description:
      "invalid Request/Transaction/(ApplePay|GooglePay|SamsungPay)/PaymentToken tag (decryption error)",
  },
  {
    code: "200.200.106",
    description: "duplicate transaction. Please verify that the UUID is unique",
  },
  { code: "200.300.403", description: "Invalid HTTP method" },
  { code: "200.300.404", description: "invalid or missing parameter" },
  { code: "200.300.405", description: "Duplicate entity" },
  { code: "200.300.406", description: "Entity not found" },
  { code: "200.300.407", description: "Entity not specific enough" },
  {
    code: "300.100.100",
    description:
      "Transaction declined (additional customer authentication required)",
  },
  {
    code: "500.100.201",
    description: "Channel/Merchant is disabled (no processing possible)",
  },
  {
    code: "500.100.202",
    description: "Channel/Merchant is new (no processing possible yet)",
  },
  {
    code: "500.100.203",
    description: "Channel/Merchant is closed (no processing possible)",
  },
  {
    code: "500.100.301",
    description: "Merchant-Connector is disabled (no processing possible)",
  },
  {
    code: "500.100.302",
    description: "Merchant-Connector is new (no processing possible yet)",
  },
  {
    code: "500.100.303",
    description: "Merchant-Connector is closed (no processing possible)",
  },
  {
    code: "500.100.304",
    description:
      "Merchant-Connector is disabled at gateway (no processing possible)",
  },
  {
    code: "500.100.401",
    description: "Connector is unavailable (no processing possible)",
  },
  {
    code: "500.100.402",
    description: "Connector is new (no processing possible yet)",
  },
  {
    code: "500.100.403",
    description: "Connector is unavailable (no processing possible)",
  },
  {
    code: "500.200.101",
    description: "No target account configured for DD transaction",
  },
  {
    code: "600.100.100",
    description: "Unexpected Integrator Error (Request could not be processed)",
  },
  { code: "600.200.100", description: "invalid Payment Method" },
  { code: "600.200.200", description: "Unsupported Payment Method" },
  {
    code: "600.200.201",
    description: "Channel/Merchant not configured for this payment method",
  },
  {
    code: "600.200.202",
    description: "Channel/Merchant not configured for this payment type",
  },
  { code: "600.200.300", description: "invalid Payment Type" },
  {
    code: "600.200.310",
    description: "invalid Payment Type for given Payment Method",
  },
  { code: "600.200.400", description: "Unsupported Payment Type" },
  {
    code: "600.200.500",
    description:
      "Invalid payment data. You are not configured for this currency or sub type (country or brand)",
  },
  {
    code: "600.200.501",
    description:
      "Invalid payment data for Recurring transaction. Merchant or transaction data has wrong recurring configuration.",
  },
  {
    code: "600.200.600",
    description: "invalid payment code (type or method)",
  },
  {
    code: "600.200.700",
    description:
      "invalid payment mode (you are not configured for the requested transaction mode)",
  },
  { code: "600.200.701", description: "testMode not allowed" },
  {
    code: "600.200.800",
    description:
      "invalid brand for given payment method and payment mode (you are not configured for the requested transaction mode)",
  },
  { code: "600.200.810", description: "invalid return code provided" },
  { code: "600.300.101", description: "Merchant key not found" },
  {
    code: "600.300.200",
    description: "merchant source IP address not whitelisted",
  },
  {
    code: "600.300.210",
    description: "merchant notificationUrl not whitelisted",
  },
  { code: "600.300.211", description: "shopperResultUrl not whitelisted" },
  { code: "700.100.100", description: "reference id does not exist" },
  { code: "700.100.200", description: "non matching reference amount" },
  { code: "700.100.300", description: "invalid amount (probably too large)" },
  {
    code: "700.100.400",
    description:
      "referenced payment method does not match with requested payment method",
  },
  {
    code: "700.100.500",
    description:
      "referenced payment currency does not match with requested payment currency",
  },
  {
    code: "700.100.600",
    description: "referenced mode does not match with requested payment mode",
  },
  {
    code: "700.100.700",
    description: "referenced transaction is of inappropriate type",
  },
  {
    code: "700.100.701",
    description:
      "referenced a DB transaction without explicitly providing an account. Not allowed to used referenced account.",
  },
  {
    code: "700.100.710",
    description: "cross-linkage of two transaction-trees",
  },
  {
    code: "700.300.100",
    description:
      "referenced tx can not be refunded, captured or reversed (invalid type)",
  },
  { code: "700.300.200", description: "referenced tx was rejected" },
  {
    code: "700.300.300",
    description:
      "referenced tx can not be refunded, captured or reversed (already refunded, captured or reversed)",
  },
  {
    code: "700.300.400",
    description: "referenced tx can not be captured (cut off time reached)",
  },
  {
    code: "700.300.500",
    description: "chargeback error (multiple chargebacks)",
  },
  {
    code: "700.300.600",
    description:
      "referenced tx can not be refunded or reversed (was chargebacked)",
  },
  {
    code: "700.300.700",
    description:
      "referenced tx can not be reversed (reversal not possible anymore)",
  },
  { code: "700.300.800", description: "referenced tx can not be voided" },
  {
    code: "700.400.000",
    description: "serious workflow error (call support)",
  },
  {
    code: "700.400.100",
    description:
      "cannot capture (PA value exceeded, PA reverted or invalid workflow?)",
  },
  {
    code: "700.400.101",
    description: "cannot capture (Not supported by authorization system)",
  },
  {
    code: "700.400.200",
    description:
      "cannot refund (refund volume exceeded or tx reversed or invalid workflow?)",
  },
  {
    code: "700.400.300",
    description:
      "cannot reverse (already refunded|reversed, invalid workflow or amount exceeded)",
  },
  {
    code: "700.400.400",
    description:
      "cannot chargeback (already chargebacked or invalid workflow?)",
  },
  {
    code: "700.400.402",
    description:
      "chargeback can only be generated internally by the payment system",
  },
  {
    code: "700.400.410",
    description:
      "cannot reversal chargeback (chargeback is already reversaled or invalid workflow?)",
  },
  {
    code: "700.400.411",
    description:
      "cannot reverse chargeback or invalid workflow (second chargeback)",
  },
  {
    code: "700.400.420",
    description:
      "cannot reversal chargeback (no chargeback existing or invalid workflow?)",
  },
  {
    code: "700.400.510",
    description:
      "capture needs at least one successful transaction of type (PA)",
  },
  {
    code: "700.400.520",
    description:
      "refund needs at least one successful transaction of type (CP or DB or RB or RC)",
  },
  {
    code: "700.400.530",
    description:
      "reversal needs at least one successful transaction of type (CP or DB or RB or PA)",
  },
  {
    code: "700.400.540",
    description:
      "reconceile needs at least one successful transaction of type (CP or DB or RB)",
  },
  {
    code: "700.400.550",
    description:
      "chargeback needs at least one successful transaction of type (CP or DB or RB)",
  },
  {
    code: "700.400.560",
    description:
      "receipt needs at least one successful transaction of type (PA or CP or DB or RB)",
  },
  {
    code: "700.400.561",
    description:
      "receipt on a registration needs a successfull registration in state 'OPEN'",
  },
  {
    code: "700.400.562",
    description:
      "receipts are configured to be generated only internally by the payment system",
  },
  {
    code: "700.400.565",
    description:
      "finalize needs at least one successful transaction of type (PA or DB)",
  },
  {
    code: "700.400.570",
    description: "cannot reference a waiting/pending transaction",
  },
  { code: "700.400.580", description: "cannot find transaction" },
  {
    code: "700.400.590",
    description:
      "installment needs at least one successful transaction of type (DB or PA)",
  },
  {
    code: "700.400.600",
    description:
      "finalize needs at least one successful transaction of type (IN, DB, PA or CD)",
  },
  {
    code: "700.400.700",
    description: "initial and referencing channel-ids do not match",
  },
  {
    code: "700.450.001",
    description: "cannot transfer money from one account to the same account",
  },
  {
    code: "700.500.001",
    description: "referenced session contains too many transactions",
  },
  {
    code: "700.500.002",
    description:
      "capture or preauthorization appears too late in referenced session",
  },
  {
    code: "700.500.003",
    description: "test accounts not allowed in production",
  },
  {
    code: "700.500.004",
    description:
      "cannot refer a transaction which contains deleted customer information",
  },
  {
    code: "800.100.100",
    description: "transaction declined for unknown reason",
  },
  {
    code: "800.100.150",
    description: "transaction declined (refund on gambling tx not allowed)",
  },
  { code: "800.100.151", description: "transaction declined (invalid card)" },
  {
    code: "800.100.152",
    description: "transaction declined by authorization system",
  },
  { code: "800.100.153", description: "transaction declined (invalid CVV)" },
  {
    code: "800.100.154",
    description: "transaction declined (transaction marked as invalid)",
  },
  {
    code: "800.100.155",
    description: "transaction declined (amount exceeds credit)",
  },
  { code: "800.100.156", description: "transaction declined (format error)" },
  {
    code: "800.100.157",
    description: "transaction declined (wrong expiry date)",
  },
  {
    code: "800.100.158",
    description: "transaction declined (suspecting manipulation)",
  },
  { code: "800.100.159", description: "transaction declined (stolen card)" },
  { code: "800.100.160", description: "transaction declined (card blocked)" },
  {
    code: "800.100.161",
    description: "transaction declined (too many invalid tries)",
  },
  {
    code: "800.100.162",
    description: "transaction declined (limit exceeded)",
  },
  {
    code: "800.100.163",
    description:
      "transaction declined (maximum transaction frequency exceeded)",
  },
  {
    code: "800.100.164",
    description: "transaction declined (merchants limit exceeded)",
  },
  { code: "800.100.165", description: "transaction declined (card lost)" },
  {
    code: "800.100.166",
    description:
      "transaction declined (Incorrect personal identification number)",
  },
  {
    code: "800.100.167",
    description:
      "transaction declined (referencing transaction does not match)",
  },
  {
    code: "800.100.168",
    description: "transaction declined (restricted card)",
  },
  {
    code: "800.100.169",
    description:
      "transaction declined (card type is not processed by the authorization center)",
  },
  {
    code: "800.100.170",
    description: "transaction declined (transaction not permitted)",
  },
  { code: "800.100.171", description: "transaction declined (pick up card)" },
  {
    code: "800.100.172",
    description: "transaction declined (account blocked)",
  },
  {
    code: "800.100.173",
    description:
      "transaction declined (invalid currency, not processed by authorization center)",
  },
  {
    code: "800.100.174",
    description: "transaction declined (invalid amount)",
  },
  {
    code: "800.100.175",
    description: "transaction declined (invalid brand)",
  },
  {
    code: "800.100.176",
    description:
      "transaction declined (account temporarily not available. Please try again later)",
  },
  {
    code: "800.100.177",
    description: "transaction declined (amount field should not be empty)",
  },
  {
    code: "800.100.178",
    description: "transaction declined (PIN entered incorrectly too often)",
  },
  {
    code: "800.100.179",
    description: "transaction declined (exceeds withdrawal count limit)",
  },
  {
    code: "800.100.190",
    description: "transaction declined (invalid configuration data)",
  },
  {
    code: "800.100.191",
    description:
      "transaction declined (transaction in wrong state on aquirer side)",
  },
  {
    code: "800.100.192",
    description:
      "transaction declined (invalid CVV, Amount has still been reserved on the customer's card and will be released in a few business days. Please ensure the CVV code is accurate before retrying the transaction)",
  },
  {
    code: "800.100.195",
    description: "transaction declined (UserAccount Number/ID unknown)",
  },
  {
    code: "800.100.196",
    description: "transaction declined (registration error)",
  },
  {
    code: "800.100.197",
    description: "transaction declined (registration cancelled externally)",
  },
  {
    code: "800.100.198",
    description: "transaction declined (invalid holder)",
  },
  {
    code: "800.100.199",
    description: "transaction declined (invalid tax number)",
  },
  {
    code: "800.100.200",
    description: "Refer to Payer due to reason not specified",
  },
  { code: "800.100.201", description: "Account or Bank Details Incorrect" },
  { code: "800.100.202", description: "Account Closed" },
  { code: "800.100.203", description: "Insufficient Funds" },
  { code: "800.100.204", description: "Mandate Expired" },
  { code: "800.100.205", description: "Mandate Discarded" },
  {
    code: "800.100.206",
    description: "Refund of an authorized payment requested by the customer",
  },
  { code: "800.100.207", description: "Refund requested" },
  {
    code: "800.100.208",
    description: "Direct debit not enabled for the specified account or bank",
  },
  {
    code: "800.100.300",
    description: "Network token transaction declined (the PAN data is invalid)",
  },
  {
    code: "800.100.301",
    description:
      "Network token transaction declined (the issuer considers the PAN as not eligible for tokenization)",
  },
  {
    code: "800.100.302",
    description:
      "Network token transaction declined (the issuer declined the tokenization)",
  },
  {
    code: "800.100.303",
    description:
      "Network token transaction declined (session timeout expired with card scheme)",
  },
  {
    code: "800.100.304",
    description:
      "Network token transaction declined (card scheme not identified or supported)",
  },
  {
    code: "800.100.305",
    description:
      "Network token transaction declined (merchant id wrong or merchant not onboarded)",
  },
  {
    code: "800.100.306",
    description:
      "Network token transaction declined (data cannot be decrypted)",
  },
  {
    code: "800.100.307",
    description:
      "Network token transaction declined (invalid network token state - operation not allowed)",
  },
  {
    code: "800.100.308",
    description:
      "Network token transaction declined (request cannot be verified by the card scheme)",
  },
  {
    code: "800.100.309",
    description:
      "Network token transaction declined (aborted by the card scheme)",
  },
  {
    code: "800.100.310",
    description: "Network token transaction declined (unknown reason)",
  },
  {
    code: "800.100.311",
    description:
      "Network token transaction declined (network token request in-flight)",
  },
  {
    code: "800.100.312",
    description:
      "Network token transaction declined (network token not available but requested)",
  },
  {
    code: "800.100.313",
    description:
      "Network token transaction declined (insufficient data to request a network token)",
  },
  {
    code: "800.100.314",
    description:
      "Network token transaction declined (network token already exists)",
  },
  {
    code: "800.100.315",
    description:
      "Network token transaction declined (required field not present)",
  },
  {
    code: "800.100.316",
    description:
      "Network token transaction declined (not processed - token vault configuration error)",
  },
  {
    code: "800.100.317",
    description: "Network token transaction declined (suspended network token)",
  },
  {
    code: "800.100.318",
    description:
      "Network token transaction declined (at least one transaction with cryptogram required)",
  },
  {
    code: "800.100.320",
    description:
      "Network token transaction declined (token service provider non retryable generic error)",
  },
  {
    code: "800.100.321",
    description:
      "Network token transaction declined (token service provider retryable generic error)",
  },
  {
    code: "800.100.322",
    description:
      "Network token transaction declined (card scheme retryable generic error)",
  },
  {
    code: "800.100.323",
    description:
      "Network token transaction declined (card scheme non retryable generic error)",
  },
  {
    code: "800.100.324",
    description: "Network token transaction declined (format error)",
  },
  {
    code: "800.100.325",
    description: "Network token transaction declined (unauthorized)",
  },
  {
    code: "800.100.326",
    description: "Network token transaction declined (network token not found)",
  },
  {
    code: "800.100.327",
    description: "Network token transaction declined (too many requests)",
  },
  {
    code: "800.100.330",
    description: "Network token transaction declined (network token expired)",
  },
  { code: "800.100.402", description: "cc/bank account holder not valid" },
  {
    code: "800.100.403",
    description: "transaction declined (revocation of authorisation order)",
  },
  {
    code: "800.100.500",
    description:
      "Card holder has advised his bank to stop this recurring payment",
  },
  {
    code: "800.100.501",
    description:
      "Card holder has advised his bank to stop all recurring payments for this merchant",
  },
  { code: "800.110.100", description: "duplicate transaction" },
  { code: "800.120.100", description: "Rejected by Throttling." },
  {
    code: "800.120.101",
    description: "maximum number of transactions per account already exceeded",
  },
  {
    code: "800.120.102",
    description: "maximum number of transactions per ip already exceeded",
  },
  {
    code: "800.120.103",
    description: "maximum number of transactions per email already exceeded",
  },
  {
    code: "800.120.200",
    description: "maximum total volume of transactions already exceeded",
  },
  {
    code: "800.120.201",
    description:
      "maximum total volume of transactions per account already exceeded",
  },
  {
    code: "800.120.202",
    description: "maximum total volume of transactions per ip already exceeded",
  },
  {
    code: "800.120.203",
    description:
      "maximum total volume of transactions per email already exceeded",
  },
  { code: "800.120.300", description: "chargeback rate per bin exceeded" },
  {
    code: "800.120.401",
    description:
      "maximum number of transactions or total volume for configured MIDs or CIs exceeded",
  },
  { code: "800.120.402", description: "Payment already processing." },
  {
    code: "800.121.100",
    description:
      "Channel not configured for given source type. Please contact your account manager.",
  },
  {
    code: "800.121.200",
    description:
      "Secure Query is not enabled for this entity. Please contact your account manager.",
  },
  {
    code: "800.121.300",
    description:
      "SMS is not enabled for this entity. Please contact your account manager.",
  },
  {
    code: "800.121.400",
    description:
      "Marketplace Payments is not enabled. Please contact your account manager.",
  },
  {
    code: "800.130.100",
    description: "Transaction with same TransactionId already exists",
  },
  {
    code: "800.140.100",
    description: "maximum number of registrations per mobile number exceeded",
  },
  {
    code: "800.140.101",
    description: "maximum number of registrations per email address exceeded",
  },
  {
    code: "800.140.110",
    description:
      "maximum number of registrations of mobile per credit card number exceeded",
  },
  {
    code: "800.140.111",
    description:
      "maximum number of registrations of credit card number per mobile exceeded",
  },
  {
    code: "800.140.112",
    description:
      "maximum number of registrations of email per credit card number exceeded",
  },
  {
    code: "800.140.113",
    description:
      "maximum number of registrations of credit card number per email exceeded",
  },
  {
    code: "800.150.100",
    description: "Account Holder does not match Customer Name",
  },
  {
    code: "800.160.100",
    description: "Invalid payment data for configured Shopper Dispatching Type",
  },
  {
    code: "800.160.110",
    description: "Invalid payment data for configured Payment Dispatching Type",
  },
  {
    code: "800.160.120",
    description:
      "Invalid payment data for configured Recurring Transaction Dispatching Type",
  },
  {
    code: "800.160.130",
    description:
      "Invalid payment data for configured TicketSize Dispatching Type",
  },
  {
    code: "800.200.159",
    description: "account or user is blacklisted (card stolen)",
  },
  {
    code: "800.200.160",
    description: "account or user is blacklisted (card blocked)",
  },
  {
    code: "800.200.165",
    description: "account or user is blacklisted (card lost)",
  },
  {
    code: "800.200.202",
    description: "account or user is blacklisted (account closed)",
  },
  {
    code: "800.200.208",
    description: "account or user is blacklisted (account blocked)",
  },
  {
    code: "800.200.220",
    description: "account or user is blacklisted (fraudulent transaction)",
  },
  { code: "800.300.101", description: "account or user is blacklisted" },
  { code: "800.300.102", description: "country blacklisted" },
  { code: "800.300.200", description: "email is blacklisted" },
  { code: "800.300.301", description: "ip blacklisted" },
  { code: "800.300.302", description: "ip is anonymous proxy" },
  { code: "800.300.401", description: "bin blacklisted" },
  {
    code: "800.300.500",
    description:
      "transaction temporary blacklisted (too many tries invalid CVV)",
  },
  {
    code: "800.300.501",
    description:
      "transaction temporary blacklisted (too many tries invalid expire date)",
  },
  { code: "800.310.200", description: "Account closed" },
  { code: "800.310.210", description: "Account not found" },
  {
    code: "800.310.211",
    description: "Account not found (BIN/issuer not participating)",
  },
  { code: "800.400.100", description: "AVS Check Failed" },
  { code: "800.400.101", description: "Mismatch of AVS street value" },
  { code: "800.400.102", description: "Mismatch of AVS street number" },
  { code: "800.400.103", description: "Mismatch of AVS PO box value fatal" },
  {
    code: "800.400.104",
    description: "Mismatch of AVS zip code value fatal",
  },
  {
    code: "800.400.105",
    description:
      "Mismatch of AVS settings (AVSkip, AVIgnore, AVSRejectPolicy) value",
  },
  {
    code: "800.400.110",
    description:
      "AVS Check Failed. Amount has still been reserved on the customer's card and will be released in a few business days. Please ensure the billing address is accurate before retrying the transaction.",
  },
  { code: "800.400.150", description: "Implausible address data" },
  { code: "800.400.151", description: "Implausible address state data" },
  {
    code: "800.400.200",
    description: "Invalid Payer Authentication in 3DSecure transaction",
  },
  {
    code: "800.400.500",
    description:
      "Waiting for confirmation of non-instant payment. Denied for now.",
  },
  {
    code: "800.400.501",
    description:
      "Waiting for confirmation of non-instant debit. Denied for now.",
  },
  {
    code: "800.400.502",
    description:
      "Waiting for confirmation of non-instant refund. Denied for now.",
  },
  {
    code: "800.500.100",
    description: "direct debit transaction declined for unknown reason",
  },
  {
    code: "800.500.110",
    description:
      "Unable to process transaction - ran out of terminalIds - please contact acquirer",
  },
  {
    code: "800.600.100",
    description: "transaction is being already processed",
  },
  {
    code: "800.700.100",
    description:
      "transaction for the same session is currently being processed, please try again later.",
  },
  { code: "800.700.101", description: "family name too long" },
  { code: "800.700.201", description: "given name too long" },
  { code: "800.700.500", description: "company name too long" },
  { code: "800.800.102", description: "Invalid street" },
  { code: "800.800.202", description: "Invalid zip" },
  { code: "800.800.302", description: "Invalid city" },
  {
    code: "800.800.400",
    description: "Connector/acquirer system is under maintenance",
  },
  {
    code: "800.800.800",
    description:
      "The payment system is currenty unavailable, please contact support in case this happens again.",
  },
  {
    code: "800.800.801",
    description:
      "The payment system is currenty unter maintenance. Please apologize for the inconvenience this may cause. If you were not informed of this maintenance window in advance, contact your sales representative.",
  },
  { code: "800.900.100", description: "sender authorization failed " },
  {
    code: "800.900.101",
    description: "invalid email address (probably invalid syntax)",
  },
  {
    code: "800.900.200",
    description:
      "invalid phone number (has to start with a digit or a '+', at least 7 and max 25 chars long)",
  },
  { code: "800.900.201", description: "unknown channel" },
  { code: "800.900.300", description: "invalid authentication information" },
  {
    code: "800.900.301",
    description:
      "user authorization failed, user has no sufficient rights to process transaction",
  },
  { code: "800.900.302", description: "Authorization failed" },
  { code: "800.900.303", description: "No token created" },
  { code: "800.900.399", description: "Secure Registration Problem" },
  { code: "800.900.401", description: "Invalid IP number" },
  { code: "800.900.450", description: "Invalid birthdate" },
  {
    code: "900.100.100",
    description: "unexpected communication error with connector/acquirer",
  },
  {
    code: "900.100.200",
    description: "error response from connector/acquirer",
  },
  {
    code: "900.100.201",
    description:
      "error on the external gateway (e.g. on the part of the bank, acquirer,...)",
  },
  {
    code: "900.100.202",
    description:
      "invalid transaction flow, the requested function is not applicable for the referenced transaction.",
  },
  { code: "900.100.203", description: "error on the internal gateway" },
  { code: "900.100.204", description: "Error during message parsing" },
  { code: "900.100.205", description: "Error response from token vault" },
  { code: "900.100.300", description: "timeout, uncertain result" },
  {
    code: "900.100.301",
    description:
      "Transaction timed out without response from connector/acquirer. It was reversed.",
  },
  {
    code: "900.100.310",
    description:
      "Transaction timed out due to internal system misconfiguration. Request to acquirer has not been sent.",
  },
  { code: "900.100.400", description: "timeout at connectors/acquirer side" },
  {
    code: "900.100.500",
    description: "timeout at connectors/acquirer side (try later)",
  },
  { code: "900.100.600", description: "connector/acquirer currently down" },
  {
    code: "900.100.700",
    description: "error on the external service provider",
  },
  {
    code: "900.200.100",
    description: "Message Sequence Number of Connector out of sync",
  },
  { code: "900.300.600", description: "user session timeout" },
  {
    code: "900.400.100",
    description: "unexpected communication error with external risk provider",
  },
  { code: "999.999.888", description: "UNDEFINED PLATFORM DATABASE ERROR" },
  { code: "999.999.999", description: "UNDEFINED CONNECTOR/ACQUIRER ERROR" },
];

const paytabsEnglishResultCodes = [
  {
    code: null,
    status: "A",
    message: "This is a successful transaction",
    reason: "-",
  },
  {
    code: "1",
    status: "E",
    message: "Authentication Failed",
    reason:
      "This error happened cause the PayTabs system failed to authenticate/identify the sent request information from the merchant side.",
  },
  {
    code: "2",
    status: "E",
    message: "Invalid request",
    reason: "Passing invalid request payload format or including invalid data",
  },
  {
    code: "3",
    status: "E",
    message: "Invalid profile ID",
    reason: "Missing or invalid passed data inside the profile_id parameter",
  },
  {
    code: "4",
    status: "E",
    message: "Duplicate request",
    reason:
      "PayTabs system found that the sent request information had been submitted with the same details (cart_id, amount, currency, profile_id) within less than 2 minutes.",
  },
  {
    code: "5",
    status: "E",
    message: "Request limit exceeded",
    reason:
      "The requests initiated in step 7 of the integration, which we call 'Follow-up' requests, can not exceed 30 requests per minute for aggregate merchants.",
  },
  {
    code: "101",
    status: "E",
    message: "Cart ID not valid",
    reason:
      "The passed cart_id is not accepted by the system due to some rules/constraints or validation checks.",
  },
  {
    code: "102",
    status: "E",
    message: "Description not valid",
    reason:
      "The passed cart_description is not accepted by the system due to some rules/constraints or validation checks.",
  },
  {
    code: "103",
    status: "E",
    message: "Name not valid",
    reason:
      "The passed customer_details.name is not accepted by the system due to some rules/constraints or validation checks, such as names that contain numbers.",
  },
  {
    code: "104",
    status: "E",
    message: "Address not valid",
    reason:
      "The passed customer_details.street1 is not accepted by the system due to some rules/constraints or validation checks, such as those containing symbols.",
  },
  {
    code: "105",
    status: "E",
    message: "Country not valid",
    reason:
      "The passed customer_details.country code is not identified by the system due to some rules/constraints or validation checks.",
  },
  {
    code: "106",
    status: "E",
    message: "Email not valid",
    reason:
      "The passed customer_details.email is not accepted by the system due to some rules/constraints or validation checks.",
  },
  {
    code: "107",
    status: "E",
    message: "Phone number not valid",
    reason:
      "The passed customer_details.phone is not accepted by the system due to some rules/constraints or validation checks.",
  },
  {
    code: "108",
    status: "E",
    message: "IP address not valid",
    reason:
      "The passed customer_details.email is not accepted by the system due to some rules/constraints or validation checks.",
  },
  {
    code: "109",
    status: "E",
    message: "Invalid transaction mode",
    reason:
      "You are performing a transaction with a transaction_type that is not configured on your profile, such as Auth transactions, while your profile is configured to Sale only.",
  },
  {
    code: "110",
    status: "E",
    message: "Invalid transaction type",
    reason:
      "Passing a typo or a wrong transaction type within the payment request payload.",
  },
  {
    code: "111",
    status: "E",
    message: "Invalid transaction class",
    reason:
      "Passing a typo or a wrong transaction class within the payment request payload.",
  },
  {
    code: "112",
    status: "E",
    message: "Method/Class/Currency combination not supported",
    reason:
      "Passing a combination of transaction class and transaction type along with a payment method and currency code not configured in your profile.",
  },
  {
    code: "113",
    status: "E",
    message: "Invalid transaction reference",
    reason:
      "Passing invalid or missing transaction references in the requests initiated in step 7 of the integration, which we call 'Follow-up' requests.",
  },
  {
    code: "114",
    status: "E",
    message: "Amount differs from original",
    reason:
      "In some APMs that initiate the payment first, then connect to PayTabs, such as the separate integration (not under HPP) of ApplePay and STCPay, if the amount passed to PayTabs from your side is not the same passed to the APM from your side, this error will be thrown.",
  },
  {
    code: "115",
    status: "E",
    message: "Original transaction not authorised",
    reason:
      "Passing a transaction reference in the requests initiated in step 7 of the integration, which we call 'Follow-up' requests for a NOT 'A' transaction.",
  },
  {
    code: "116",
    status: "E",
    message: "Original transaction already voided",
    reason:
      "Passing a transaction reference in the requests initiated in step 7 of the integration, which we call 'Follow-up' requests for an already voided transaction.",
  },
  {
    code: "117",
    status: "E",
    message: "Original transaction mismatch",
    reason:
      "The transaction reference provided by the third-party provider, such as banks and processors, does not match the original transaction reference you were redirected with.",
  },
  {
    code: "118",
    status: "E",
    message: "Amount greater than available balance",
    reason:
      "Trying to void or release a transaction with an amount that is greater than the rest of the original amount is still on hold indeed.",
  },
  {
    code: "119",
    status: "E",
    message: "Original transaction can not be voided",
    reason:
      "Passing a transaction reference in the requests initiated in step 7 of the integration, which we call 'Follow-up' requests, which we can NOT void due to some rules/constraints, most probably from the bank side.",
  },
  {
    code: "120",
    status: "E",
    message: "Previous transaction is on hold",
    reason:
      "Passing a transaction reference in the requests initiated in step 7 of the integration, which we call 'Follow-up' requests for a transaction that is already on hold/pending some actions to be completed.",
  },
  {
    code: "121",
    status: "E",
    message: "Transaction mode differs from original",
    reason:
      "Passing a transaction type in the requests initiated in step 7 of the integration, which we call 'Follow-up' requests that differ from the original/parent transaction.",
  },
  {
    code: "200",
    status: "E",
    message: "Invalid card number",
    reason:
      "The customer's card number is invalid,alid and the card processor can't find the related account. This could also occur if a were used on a live profile or vice versa.",
  },
  {
    code: "201",
    status: "E",
    message: "Invalid card expiry date",
    reason: "Passing invalid or mismatched card expiry date.",
  },
  {
    code: "202",
    status: "E",
    message: "Invalid card security code (CVV)",
    reason: "Passing invalid or mismatched card security code (CVV).",
  },
  {
    code: "203",
    status: "E",
    message: "Invalid account",
    reason:
      "The customer's account used in the APM (Alternative Payment Method such as STCPay or ValU) is invalid.",
  },
  {
    code: "204",
    status: "E",
    message: "Previous transaction in use",
    reason:
      "Passing a transaction reference in the requests initiated in step 7 of the integration, which we call 'Follow-up' requests for a transaction that is already in use with other 'Follow-up' request.",
  },
  {
    code: "205",
    status: "E",
    message: "Invalid payment method",
    reason:
      "Trying to perform a payment with a payment method that is not yet configured on your profile.",
  },
  {
    code: "206",
    status: "D",
    message: "Currency mismatch",
    reason:
      "Passing a currency code in the requests initiated in step 7 of the integration, which we call 'Follow-up' requests that mismatched the original/parent transaction's currency code.",
  },
  {
    code: "207",
    status: "E",
    message: "Invalid terminal",
    reason:
      "A general issue in identifying the configured terminal on your profile.",
  },
  {
    code: "208",
    status: "E",
    message: "Invalid return url",
    reason:
      "The passed return URL is not accepted by the system due to some rules/constraints or validation checks.",
  },
  {
    code: "210",
    status: "E",
    message: "Invalid callback url",
    reason:
      "The passed callback URL is not accepted by the system due to some rules/constraints or validation checks.",
  },
  {
    code: "300",
    status: "D",
    message: "Not authorised",
    reason:
      "An error occurred during the transaction without the reason specified.",
  },
  {
    code: "301",
    status: "D",
    message: "Card expiry date required",
    reason: "Missing card expiry date.",
  },
  {
    code: "302",
    status: "D",
    message: "Card expired/Incorrect expiry date",
    reason: "Passing invalid or old card expiry date (card already expired).",
  },
  {
    code: "303",
    status: "D",
    message: "Card is for ATM use only",
    reason:
      "The issuer bank has declined the transaction because the card is not authorized for online use.",
  },
  {
    code: "304",
    status: "D",
    message: "Card security code (CVV) required",
    reason: "Missing card security code (CVV).",
  },
  {
    code: "305",
    status: "D",
    message: "Card security code (CVV) mismatch",
    reason: "Passing invalid or mismatched card security code (CVV).",
  },
  {
    code: "306",
    status: "D",
    message: "Address verification (AVS) mismatch",
    reason:
      "The passed address (customer_details.street1) is not accepted by the system due to some rules/constraints or validation checks.",
  },
  {
    code: "307",
    status: "D",
    message: "Card security code (CVV) and address (AVS) mismatch",
    reason:
      "The passed address (customer_details.street1) and card CVV are not accepted by the system due to some rules/constraints or validation checks.",
  },
  {
    code: "308",
    status: "D",
    message: "Card is not enabled for e-commerce",
    reason:
      "The issuer bank has declined the transaction because the card is not authorized for online use.",
  },
  {
    code: "309",
    status: "D",
    message: "3DSecure authentication not available for this card",
    reason:
      "Either the issuer bank does NOT support 3DSecure authentication mode at all, or the customer's card does NOT (have active/enrolled in) 3DSecure authentication mode.",
  },
  {
    code: "310",
    status: "D",
    message: "3DSecure authentication rejected",
    reason:
      "The customer either has entered the wrong OTP (One Time Password) or triggered the cancel option on the 3DSecure page.",
  },
  {
    code: "311",
    status: "D",
    message: "Card cancelled",
    reason:
      "The card's legitimate owner has canceled this card, so the card issuer has denied the transaction.",
  },
  {
    code: "312",
    status: "D",
    message: "No/invalid account",
    reason:
      "The customer's account used in the APM (Alternative Payment Method such as STCPay or ValU) is invalid.",
  },
  {
    code: "313",
    status: "D",
    message: "Transaction not permitted by issuer",
    reason:
      "The issuer bank prevented the transaction without a specific reason.",
  },
  {
    code: "314",
    status: "D",
    message: "Not authorised (Not Honor)",
    reason:
      "The issuer bank stopped the transaction and informing to 'not honor' the card which means not to accept payment.",
  },
  {
    code: "315",
    status: "D",
    message: "Not authorised",
    reason:
      "This a broad referral error code indicating the card issuer has blocked the transaction.",
  },
  {
    code: "316",
    status: "D",
    message: "Insufficient funds",
    reason:
      "The card issuer is blocking the transaction because the account has already exceeded the credit limit, or the pending transaction would put the card over.",
  },
  {
    code: "317",
    status: "D",
    message: "Blocked by acquirer",
    reason:
      "The acquirer bank prevented the transaction without a specific reason.",
  },
  {
    code: "318",
    status: "X",
    message: "Authorisation expired",
    reason:
      "The expiration period for transactions marked as 'Pending' has elapsed.",
  },
  {
    code: "319",
    status: "D",
    message: "Unable to void",
    reason:
      "Passing a transaction reference in the requests initiated in step 7 of the integration, which we call 'Follow-up' requests, which we can NOT void due to some rules/constraints.",
  },
  {
    code: "320",
    status: "D",
    message: "Unable to refund",
    reason:
      "Passing a transaction reference in the requests initiated in step 7 of the integration, which we call 'Follow-up' requests, which we can NOT refund due to some rules/constraints.",
  },
  {
    code: "321",
    status: "C",
    message: "Cancelled",
    reason: "The transaction has been canceled manually by the customer.",
  },
  {
    code: "322",
    status: "D",
    message: "Not supported by acquirer",
    reason:
      "Trying to perform a payment with a transaction type or class that is not supported by the acquirer bank.",
  },
  {
    code: "323",
    status: "D",
    message: "Card limits exceeded",
    reason:
      "The credit card user has exceeded the credit limit (or this transaction would put them over).",
  },
  {
    code: "324",
    status: "D",
    message: "Terminal limits exceeded",
    reason:
      "The configured terminal on your account has exceeded the credit limit (or this transaction would put them over).",
  },
  {
    code: "325",
    status: "D",
    message: "Merchant limits exceeded",
    reason:
      "You exceeded the credit limit configured to your PayTabs' merchant account (or this transaction would put them over).",
  },
  {
    code: "326",
    status: "D",
    message: "Account limits exceeded",
    reason:
      "You exceeded the credit limit configured to your account (or this transaction would put them over).",
  },
  {
    code: "327",
    status: "D",
    message: "OTP timeout",
    reason:
      "The customer failed to enter the OTP on the 3DSecure page within the allotted time.",
  },
  {
    code: "345",
    status: "D",
    message: "3DSecure authentication not completed",
    reason:
      "The customer did not complete the 3DS authentication process after being redirected to their bank's 3DSecure page, likely due to a 'connection error' or 'issuer page downtime.'",
  },
  {
    code: "400",
    status: "E",
    message: "Internal system error",
    reason:
      "Something went wrong with the transaction, usually due to a temporary systemic error.",
  },
  {
    code: "401",
    status: "E",
    message: "No response",
    reason:
      "An error occurred during the transaction without the reason specified.",
  },
  {
    code: "402",
    status: "E",
    message: "Error connecting to service provider",
    reason:
      "There's a temporary communication error between PayTabs and the acquirer bank/processor.",
  },
  {
    code: "500",
    status: "D",
    message: "Declined",
    reason:
      "The bank can't identify a specific problem, but the transaction still didn't go through.",
  },
  {
    code: "501",
    status: "D",
    message: "Fraud Report - Issuer",
    reason:
      "The customer's bank stopped the transaction because the card or bank account has been flagged as fraudulent.",
  },
  {
    code: "502",
    status: "D",
    message: "Lost Card",
    reason:
      "The legitimate owner has reported the card as lost, so the card issuer denied the transaction.",
  },
  {
    code: "503",
    status: "D",
    message: "Stolen Card",
    reason:
      "The legitimate owner has reported the card as stolen, so the card issuer denied the transaction.",
  },
  {
    code: "504",
    status: "D",
    message: "AntiFraud",
    reason:
      "The system stopped the transaction because the card or bank account has been flagged as fraudulent.",
  },
  {
    code: "600",
    status: "P",
    message: "Pending",
    reason:
      "This transaction has not been finalized and is pending further action. Such situations occur with payment methods like cash payments, which necessitate the customer paying in cash at an authorized store, or with payment methods involving manual refunds processed by the finance team.",
  },
  {
    code: "601",
    status: "H",
    message: "On Hold",
    reason:
      "The transaction has been authorized; however, it has been flagged by our anti-fraud system and is currently on hold pending further manual review or action.",
  },
];

const paytabsArabicResultCodes = [
  {
    code: null,
    status: "A",
    message: "هذه معاملة ناجحة",
    reason: "-",
  },
  {
    code: "1",
    status: "E",
    message: "فشل المصادقة",
    reason:
      "حدث هذا الخطأ لأن نظام PayTabs فشل في مصادقة/تحديد معلومات الطلب المرسلة من جانب التاجر.",
  },
  {
    code: "2",
    status: "E",
    message: "طلب غير صالح",
    reason: "إرسال تنسيق حمولة طلب غير صالح أو تضمين بيانات غير صالحة",
  },
  {
    code: "3",
    status: "E",
    message: "معرف الملف الشخصي غير صالح",
    reason: "بيانات مفقودة أو غير صالحة تم تمريرها داخل معلمة profile_id",
  },
  {
    code: "4",
    status: "E",
    message: "طلب مكرر",
    reason:
      "وجد نظام PayTabs أن معلومات الطلب المرسلة قد تم تقديمها بنفس التفاصيل (cart_id, amount, currency, profile_id) في أقل من دقيقتين.",
  },
  {
    code: "5",
    status: "E",
    message: "تجاوز حد الطلبات",
    reason:
      "لا يمكن أن تتجاوز الطلبات التي تم بدؤها في الخطوة 7 من التكامل، والتي نسميها طلبات 'المتابعة'، 30 طلبًا في الدقيقة للتجار المجمعين.",
  },
  {
    code: "101",
    status: "E",
    message: "معرف السلة غير صالح",
    reason:
      "لم يتم قبول cart_id الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق.",
  },
  {
    code: "102",
    status: "E",
    message: "الوصف غير صالح",
    reason:
      "لم يتم قبول cart_description الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق.",
  },
  {
    code: "103",
    status: "E",
    message: "الاسم غير صالح",
    reason:
      "لم يتم قبول customer_details.name الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق، مثل الأسماء التي تحتوي على أرقام.",
  },
  {
    code: "104",
    status: "E",
    message: "العنوان غير صالح",
    reason:
      "لم يتم قبول customer_details.street1 الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق، مثل تلك التي تحتوي على رموز.",
  },
  {
    code: "105",
    status: "E",
    message: "البلد غير صالح",
    reason:
      "لم يتم التعرف على رمز customer_details.country الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق.",
  },
  {
    code: "106",
    status: "E",
    message: "البريد الإلكتروني غير صالح",
    reason:
      "لم يتم قبول customer_details.email الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق.",
  },
  {
    code: "107",
    status: "E",
    message: "رقم الهاتف غير صالح",
    reason:
      "لم يتم قبول customer_details.phone الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق.",
  },
  {
    code: "108",
    status: "E",
    message: "عنوان IP غير صالح",
    reason:
      "لم يتم قبول customer_details.ip الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق.",
  },
  {
    code: "109",
    status: "E",
    message: "وضع المعاملة غير صالح",
    reason:
      "تقوم بإجراء معاملة بنوع معاملة غير مهيأ في ملفك الشخصي، مثل معاملات Auth، بينما تم تكوين ملفك الشخصي لـ Sale فقط.",
  },
  {
    code: "110",
    status: "E",
    message: "نوع المعاملة غير صالح",
    reason: "تمرير خطأ مطبعي أو نوع معاملة خاطئ ضمن حمولة طلب الدفع.",
  },
  {
    code: "111",
    status: "E",
    message: "فئة المعاملة غير صالحة",
    reason: "تمرير خطأ مطبعي أو فئة معاملة خاطئة ضمن حمولة طلب الدفع.",
  },
  {
    code: "112",
    status: "E",
    message: "تركيبة الطريقة/الفئة/العملة غير مدعومة",
    reason:
      "تمرير مجموعة من فئة المعاملة ونوع المعاملة مع طريقة دفع ورمز عملة غير مهيأة في ملفك الشخصي.",
  },
  {
    code: "113",
    status: "E",
    message: "مرجع المعاملة غير صالح",
    reason:
      "تمرير مراجع معاملة غير صالحة أو مفقودة في الطلبات التي تم بدؤها في الخطوة 7 من التكامل، والتي نسميها طلبات 'المتابعة'.",
  },
  {
    code: "114",
    status: "E",
    message: "المبلغ يختلف عن الأصلي",
    reason:
      "في بعض طرق الدفع البديلة التي تبدأ الدفع أولاً، ثم تتصل بـ PayTabs، مثل التكامل المنفصل (ليس تحت HPP) لـ ApplePay و STCPay، إذا كان المبلغ الذي تم تمريره إلى PayTabs من جانبك ليس هو نفسه الذي تم تمريره إلى طريقة الدفع البديلة من جانبك، فسيتم طرح هذا الخطأ.",
  },
  {
    code: "115",
    status: "E",
    message: "المعاملة الأصلية غير مصرح بها",
    reason:
      "تمرير مرجع معاملة في الطلبات التي تم بدؤها في الخطوة 7 من التكامل، والتي نسميها طلبات 'المتابعة' لمعاملة ليست 'A'.",
  },
  {
    code: "116",
    status: "E",
    message: "تم إلغاء المعاملة الأصلية بالفعل",
    reason:
      "تمرير مرجع معاملة في الطلبات التي تم بدؤها في الخطوة 7 من التكامل، والتي نسميها طلبات 'المتابعة' لمعاملة ملغاة بالفعل.",
  },
  {
    code: "117",
    status: "E",
    message: "عدم تطابق المعاملة الأصلية",
    reason:
      "مرجع المعاملة المقدم من قبل موفر الطرف الثالث، مثل البنوك والمعالجات، لا يتطابق مع مرجع المعاملة الأصلي الذي تمت إعادة توجيهك به.",
  },
  {
    code: "118",
    status: "E",
    message: "المبلغ أكبر من الرصيد المتاح",
    reason:
      "محاولة إلغاء أو تحرير معاملة بمبلغ أكبر من باقي المبلغ الأصلي الذي لا يزال معلقًا بالفعل.",
  },
  {
    code: "119",
    status: "E",
    message: "لا يمكن إلغاء المعاملة الأصلية",
    reason:
      "تمرير مرجع معاملة في الطلبات التي تم بدؤها في الخطوة 7 من التكامل، والتي نسميها طلبات 'المتابعة'، والتي لا يمكننا إلغاؤها بسبب بعض القيود/ القواعد، على الأرجح من جانب البنك.",
  },
  {
    code: "120",
    status: "E",
    message: "المعاملة السابقة معلقة",
    reason:
      "تمرير مرجع معاملة في الطلبات التي تم بدؤها في الخطوة 7 من التكامل، والتي نسميها طلبات 'المتابعة' لمعاملة معلقة بالفعل/بانتظار إكمال بعض الإجراءات.",
  },
  {
    code: "121",
    status: "E",
    message: "وضع المعاملة يختلف عن الأصلي",
    reason:
      "تمرير نوع معاملة في الطلبات التي تم بدؤها في الخطوة 7 من التكامل، والتي نسميها طلبات 'المتابعة' التي تختلف عن المعاملة الأصلية/الأب.",
  },
  {
    code: "200",
    status: "E",
    message: "رقم البطاقة غير صالح",
    reason:
      "رقم بطاقة العميل غير صالح، ولم يتمكن معالج البطاقة من العثور على الحساب المرتبط. يمكن أن يحدث هذا أيضًا إذا تم استخدام بطاقة اختبار في ملف تعريف حقيقي أو العكس.",
  },
  {
    code: "201",
    status: "E",
    message: "تاريخ انتهاء البطاقة غير صالح",
    reason: "تمرير تاريخ انتهاء بطاقة غير صالح أو غير متطابق.",
  },
  {
    code: "202",
    status: "E",
    message: "رمز الأمان (CVV) للبطاقة غير صالح",
    reason: "تمرير رمز أمان بطاقة (CVV) غير صالح أو غير متطابق.",
  },
  {
    code: "203",
    status: "E",
    message: "الحساب غير صالح",
    reason:
      "حساب العميل المستخدم في طريقة الدفع البديلة (مثل STCPay أو ValU) غير صالح.",
  },
  {
    code: "204",
    status: "E",
    message: "المعاملة السابقة قيد الاستخدام",
    reason:
      "تمرير مرجع معاملة في الطلبات التي تم بدؤها في الخطوة 7 من التكامل، والتي نسميها طلبات 'المتابعة' لمعاملة قيد الاستخدام بالفعل مع طلب 'متابعة' آخر.",
  },
  {
    code: "205",
    status: "E",
    message: "طريقة الدفع غير صالحة",
    reason: "محاولة إجراء دفع بطريقة دفع غير مهيأة بعد في ملفك الشخصي.",
  },
  {
    code: "206",
    status: "D",
    message: "عدم تطابق العملة",
    reason:
      "تمرير رمز عملة في الطلبات التي تم بدؤها في الخطوة 7 من التكامل، والتي نسميها طلبات 'المتابعة' التي لا تتطابق مع رمز عملة المعاملة الأصلية/الأب.",
  },
  {
    code: "207",
    status: "E",
    message: "الطرفية غير صالحة",
    reason: "مشكلة عامة في تحديد الطرفية المهيأة في ملفك الشخصي.",
  },
  {
    code: "208",
    status: "E",
    message: "رابط العودة غير صالح",
    reason:
      "لم يتم قبول رابط العودة الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق.",
  },
  {
    code: "210",
    status: "E",
    message: "رابط الاستدعاء غير صالح",
    reason:
      "لم يتم قبول رابط الاستدعاء الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق.",
  },
  {
    code: "300",
    status: "D",
    message: "غير مصرح به",
    reason: "حدث خطأ أثناء المعاملة بدون تحديد السبب.",
  },
  {
    code: "301",
    status: "D",
    message: "تاريخ انتهاء البطاقة مطلوب",
    reason: "تاريخ انتهاء البطاقة مفقود.",
  },
  {
    code: "302",
    status: "D",
    message: "انتهت صلاحية البطاقة/تاريخ انتهاء غير صحيح",
    reason:
      "تمرير تاريخ انتهاء بطاقة غير صالح أو منتهي الصلاحية (البطاقة منتهية الصلاحية بالفعل).",
  },
  {
    code: "303",
    status: "D",
    message: "البطاقة مخصصة لاستخدام أجهزة الصراف الآلي فقط",
    reason:
      "رفض بنك المصدر المعاملة لأن البطاقة غير مصرح بها للاستخدام عبر الإنترنت.",
  },
  {
    code: "304",
    status: "D",
    message: "رمز الأمان (CVV) للبطاقة مطلوب",
    reason: "رمز أمان البطاقة (CVV) مفقود.",
  },
  {
    code: "305",
    status: "D",
    message: "عدم تطابق رمز الأمان (CVV) للبطاقة",
    reason: "تمرير رمز أمان بطاقة (CVV) غير صالح أو غير متطابق.",
  },
  {
    code: "306",
    status: "D",
    message: "عدم تطابق التحقق من العنوان (AVS)",
    reason:
      "لم يتم قبول العنوان (customer_details.street1) الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق.",
  },
  {
    code: "307",
    status: "D",
    message: "عدم تطابق رمز الأمان (CVV) والعنوان (AVS)",
    reason:
      "لم يتم قبول العنوان (customer_details.street1) ورمز CVV للبطاقة الذي تم تمريره من قبل النظام بسبب بعض القيود/ القواعد أو فحوصات التحقق.",
  },
  {
    code: "308",
    status: "D",
    message: "البطاقة غير مفعلة للتجارة الإلكترونية",
    reason:
      "رفض بنك المصدر المعاملة لأن البطاقة غير مصرح بها للاستخدام عبر الإنترنت.",
  },
  {
    code: "309",
    status: "D",
    message: "مصادقة 3DSecure غير متاحة لهذه البطاقة",
    reason:
      "إما أن بنك المصدر لا يدعم وضع مصادقة 3DSecure على الإطلاق، أو أن بطاقة العميل غير مسجلة/غير نشطة في وضع مصادقة 3DSecure.",
  },
  {
    code: "310",
    status: "D",
    message: "تم رفض مصادقة 3DSecure",
    reason:
      "إما أن العميل أدخل كلمة مرور لمرة واحدة (OTP) خاطئة أو قام بتشغيل خيار الإلغاء في صفحة 3DSecure.",
  },
  {
    code: "311",
    status: "D",
    message: "تم إلغاء البطاقة",
    reason:
      "قام المالك الشرعي للبطاقة بإلغاء هذه البطاقة، لذلك رفض مصدر البطاقة المعاملة.",
  },
  {
    code: "312",
    status: "D",
    message: "لا يوجد حساب/حساب غير صالح",
    reason:
      "حساب العميل المستخدم في طريقة الدفع البديلة (مثل STCPay أو ValU) غير صالح.",
  },
  {
    code: "313",
    status: "D",
    message: "المعاملة غير مسموح بها من قبل المصدر",
    reason: "منع بنك المصدر المعاملة بدون سبب محدد.",
  },
  {
    code: "314",
    status: "D",
    message: "غير مصرح به (عدم الشرف)",
    reason:
      "أوقف بنك المصدر المعاملة وأبلغ بعدم شرف البطاقة مما يعني عدم قبول الدفع.",
  },
  {
    code: "315",
    status: "D",
    message: "غير مصرح به",
    reason: "هذا رمز خطإ إحالة واسع يشير إلى أن مصدر البطاقة قد حظر المعاملة.",
  },
  {
    code: "316",
    status: "D",
    message: "رصيد غير كافٍ",
    reason:
      "يمنع مصدر البطاقة المعاملة لأن الحساب قد تجاوز حد الائتمان بالفعل، أو أن المعاملة المعلقة ستضع البطاقة فوق الحد.",
  },
  {
    code: "317",
    status: "D",
    message: "محظور من قبل المستحوذ",
    reason: "منع بنك المستحوذ المعاملة بدون سبب محدد.",
  },
  {
    code: "318",
    status: "X",
    message: "انتهت صلاحية التفويض",
    reason: "انتهت فترة الصلاحية للمعاملات المعلّمة كـ 'معلقة'.",
  },
  {
    code: "319",
    status: "D",
    message: "غير قادر على الإلغاء",
    reason:
      "تمرير مرجع معاملة في الطلبات التي تم بدؤها في الخطوة 7 من التكامل، والتي نسميها طلبات 'المتابعة'، والتي لا يمكننا إلغاؤها بسبب بعض القيود/ القواعد.",
  },
  {
    code: "320",
    status: "D",
    message: "غير قادر على استرداد المبلغ",
    reason:
      "تمرير مرجع معاملة في الطلبات التي تم بدؤها في الخطوة 7 من التكامل، والتي نسميها طلبات 'المتابعة'، والتي لا يمكننا استرداد المبلغ لها بسبب بعض القيود/ القواعد.",
  },
  {
    code: "321",
    status: "C",
    message: "تم الإلغاء",
    reason: "تم إلغاء المعاملة يدويًا من قبل العميل.",
  },
  {
    code: "322",
    status: "D",
    message: "غير مدعوم من قبل المستحوذ",
    reason:
      "محاولة إجراء دفع بنوع معاملة أو فئة غير مدعومة من قبل بنك المستحوذ.",
  },
  {
    code: "323",
    status: "D",
    message: "تجاوز حدود البطاقة",
    reason:
      "تجاوز مستخدم البطاقة الائتمانية حد الائتمان (أو أن هذه المعاملة ستضعه فوق الحد).",
  },
  {
    code: "324",
    status: "D",
    message: "تجاوز حدود الطرفية",
    reason:
      "تجاوزت الطرفية المهيأة في حسابك حد الائتمان (أو أن هذه المعاملة ستضعها فوق الحد).",
  },
  {
    code: "325",
    status: "D",
    message: "تجاوز حدود التاجر",
    reason:
      "تجاوزت حد الائتمان المهيأ في حساب التاجر PayTabs الخاص بك (أو أن هذه المعاملة ستضعه فوق الحد).",
  },
  {
    code: "326",
    status: "D",
    message: "تجاوز حدود الحساب",
    reason:
      "تجاوزت حد الائتمان المهيأ في حسابك (أو أن هذه المعاملة ستضعه فوق الحد).",
  },
  {
    code: "327",
    status: "D",
    message: "انتهت مهلة OTP",
    reason: "فشل العميل في إدخال OTP في صفحة 3DSecure خلال الوقت المخصص.",
  },
  {
    code: "345",
    status: "D",
    message: "لم تكتمل مصادقة 3DSecure",
    reason:
      "لم يكمل العميل عملية مصادقة 3DS بعد إعادة توجيهه إلى صفحة 3DSecure الخاصة ببنكه، على الأرجح بسبب 'خطأ في الاتصال' أو 'توقف صفحة المصدر'.",
  },
  {
    code: "400",
    status: "E",
    message: "خطأ داخلي في النظام",
    reason: "حدث خطأ ما في المعاملة، عادةً بسبب خطأ نظامي مؤقت.",
  },
  {
    code: "401",
    status: "E",
    message: "لا يوجد رد",
    reason: "حدث خطأ أثناء المعاملة بدون تحديد السبب.",
  },
  {
    code: "402",
    status: "E",
    message: "خطأ في الاتصال بمقدم الخدمة",
    reason: "هناك خطأ اتصال مؤقت بين PayTabs وبنك المستحوذ/المعالج.",
  },
  {
    code: "500",
    status: "D",
    message: "مرفوض",
    reason: "لا يمكن للبنك تحديد مشكلة محددة، ولكن المعاملة لم تتم مع ذلك.",
  },
  {
    code: "501",
    status: "D",
    message: "تقرير احتيال - المصدر",
    reason:
      "أوقف بنك العميل المعاملة لأن البطاقة أو الحساب البنكي تم وضع علامة عليه كاحتيال.",
  },
  {
    code: "502",
    status: "D",
    message: "بطاقة مفقودة",
    reason:
      "أبلغ المالك الشرعي عن فقدان البطاقة، لذلك رفض مصدر البطاقة المعاملة.",
  },
  {
    code: "503",
    status: "D",
    message: "بطاقة مسروقة",
    reason:
      "أبلغ المالك الشرعي عن سرقة البطاقة، لذلك رفض مصدر البطاقة المعاملة.",
  },
  {
    code: "504",
    status: "D",
    message: "مكافحة الاحتيال",
    reason:
      "أوقف النظام المعاملة لأن البطاقة أو الحساب البنكي تم وضع علامة عليه كاحتيال.",
  },
  {
    code: "600",
    status: "P",
    message: "معلقة",
    reason:
      "لم يتم الانتهاء من هذه المعاملة وهي معلقة بانتظار إجراء آخر. تحدث مثل هذه المواقف مع طرق الدفع مثل المدفوعات النقدية، والتي تتطلب من العميل الدفع نقدًا في متجر معتمد، أو مع طرق الدفع التي تتضمن استردادًا يدويًا تتم معالجته بواسطة فريق التمويل.",
  },
  {
    code: "601",
    status: "H",
    message: "قيد الانتظار",
    reason:
      "تمت ترخيص المعاملة؛ ومع ذلك، تم وضع علامة عليها من قبل نظام مكافحة الاحتيال لدينا وهي معلقة حاليًا بانتظار مراجعة أو إجراء يدوي إضافي.",
  },
];

export const canViewTopupRequests = (user: User) =>
  hasOperationPermission("payments", "view", user);
export const canAdjustTopupBalance = (user: User, userId: string) =>
  user.role !== "user" &&
  canViewTopupRequests(user) &&
  !!userId &&
  userId !== "all" &&
  hasOperationPermission("merchants", "update", user) &&
  availableTransactionBalances(user, "create").length > 0;
export const ownsTopupRequest = (user: User, payment: ITopupRequest) =>
  user.role === "user" &&
  !!payment &&
  (payment.userId === user.id || payment.user?.id === user.id);
export const canRecreateTopup = (user: User, payment: ITopupRequest) =>
  ownsTopupRequest(user, payment) &&
  [topupRequestStatus.pending, topupRequestStatus.refused].includes(
    payment.status,
  );
export const topupMinimumExceptions = [
  "68287bf8e987158064265020",
  "6831c900ef73e32297c0a851",
];
export function topupTotals(gross: number) {
  const total = Number.isFinite(gross) ? gross : 0,
    net = Math.round((total / 1.15) * 100) / 100;
  return {
    amount:
      Math.round((total - Math.round((total - net) * 100) / 100) * 100) / 100,
    total,
    feeTotal: 0,
    taxTotal: Math.round((total - net) * 100) / 100,
  };
}
export function checkoutUrl(link: string) {
  try {
    const url = new URL(link);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export const invalidTopupDates = (filters: {
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
}) =>
  !!(
    filters.dateFromInvalid ||
    filters.dateToInvalid ||
    (filters.dateFromFilter &&
      !Number.isFinite(Date.parse(filters.dateFromFilter))) ||
    (filters.dateToFilter &&
      !Number.isFinite(Date.parse(filters.dateToFilter))) ||
    (filters.dateFromFilter &&
      filters.dateToFilter &&
      filters.dateFromFilter > filters.dateToFilter)
  );
