export const paymentResults = {
  success: "success",
  error: "error",
};

export const topupRequestStatus = {
  pending: "pending",
  confirmed: "success",
  refused: "failed",
};

export const paymentSlides = {
  loading: "loading",
  error: "error",
  success: "success",
  failed: "failed",
};

export const myFatoorahPaymentStatus = {
  pending: "Pending",
  paid: "Paid",
  canceled: "Canceled",
};

export const getMyFatoorahPaymentErrorCode = (code) => {
  switch (code) {
    case "MF001":
      return "PAYMENT_ERROR_1";
    case "MF002":
      return "PAYMENT_ERROR_2";
    case "MF003":
      return "PAYMENT_ERROR_3";
    case "MF004":
      return "PAYMENT_ERROR_4";
    case "MF005":
      return "PAYMENT_ERROR_5";
    case "MF006":
      return "PAYMENT_ERROR_6";
    case "MF007":
      return "PAYMENT_ERROR_7";
    case "MF008":
      return "PAYMENT_ERROR_8";
    case "MF009":
      return "PAYMENT_ERROR_9";
    case "MF010":
      return "PAYMENT_ERROR_10";
    case "MF020":
      return "PAYMENT_ERROR_11";
  }
  return "PAYMENT_ERROR_11";
};
