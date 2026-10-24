export const verificationRequestStatus = {
  pending: "pending",
  confirmed: "approved",
  refused: "rejected",
} as const;
export const verificationRequestTypes = { auth: "verification" } as const;
export const toVerificationRequestStatusTitle = (status: string) =>
  ({ pending: "PENDING", approved: "CONFIRMED", rejected: "REFUSED" })[
    status
  ] || "PENDING";
export const toVerificationRequestStatusColor = (status: string) =>
  ({
    pending: "bg-blue-600",
    approved: "bg-green-600",
    rejected: "bg-red-600",
  })[status] || "bg-blue-600";
export const verificationRequestsPath = (userId = "all") =>
  `/verification-requests/${userId && userId !== "all" ? userId : "all"}`;
export const canReviewVerificationRequest = (status: string, next: string) =>
  Object.values(verificationRequestStatus).some((value) => value === status) &&
  (next === verificationRequestStatus.confirmed ||
    next === verificationRequestStatus.refused) &&
  status !== next;

export const verificationRequestUserTypes = {
  individual: "individual",
  company: "company",
  smallStore: "smallStore",
} as const;
export const toVerificationRequestUserTypeTitle = (type: string) =>
  ({ individual: "INDIVIDUAL", company: "COMPANY", smallStore: "SMALL_STORE" })[
    type
  ] || "INDIVIDUAL";
export const toVerificationRequestUserTypeColor = (type: string) =>
  ({
    individual: "bg-blue-500",
    company: "bg-green-500",
    smallStore: "bg-purple-500",
  })[type] || "bg-blue-500";
