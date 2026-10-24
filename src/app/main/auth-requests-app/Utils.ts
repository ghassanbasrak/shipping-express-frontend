export const authRequestStatus = {
  pending: "pending",
  confirmed: "approved",
  refused: "rejected",
} as const;
export const authRequestTypes = { auth: "authorization" } as const;
export const toAuthRequestStatusTitle = (status: string) =>
  ({ pending: "PENDING", approved: "CONFIRMED", rejected: "REFUSED" })[
    status
  ] || "PENDING";
export const toAuthRequestStatusColor = (status: string) =>
  ({
    pending: "bg-blue-600",
    approved: "bg-green-600",
    rejected: "bg-red-600",
  })[status] || "bg-blue-600";
export const authRequestsPath = (userId = "all") =>
  `/auth-requests/${userId && userId !== "all" ? userId : "all"}`;
export const canReviewAuthRequest = (status: string, next: string) =>
  status === authRequestStatus.pending &&
  (next === authRequestStatus.confirmed || next === authRequestStatus.refused);
