import { apiService as api } from "app/store/apiService";
import ITopupRequest from "../topup-requests-app/models/ITopupRequest";
export const addTagTypes = [
  "TopupRequests",
  "TopupRequest",
  "TopupRequestsUser",
  "Transactions",
  "TransactionAccount",
  "ShipmentAccount",
] as const;
const PaymentApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getCallbackPaymentStatus: build.mutation<
      GetCallbackPaymentStatusApiResponse,
      string
    >({
      query: (paymentId) => ({
        url: "v1/payments/payment-status",
        method: "POST",
        data: { keyType: "PaymentId", key: paymentId },
      }),
    }),
    updateCallbackPayment: build.mutation<
      ITopupRequest,
      UpdateCallbackPaymentApiArg
    >({
      query: (value) => ({
        url: `v1/payments/${value.id}`,
        method: "PATCH",
        data: {
          transactionId: value.transactionId,
          status: value.status,
          reference: value.reference,
        },
      }),
      invalidatesTags: (_, __, value) => [
        "TopupRequests",
        { type: "TopupRequest", id: value.id },
        "TopupRequestsUser",
        "Transactions",
        "TransactionAccount",
        "ShipmentAccount",
      ],
    }),
  }),
  overrideExisting: false,
});
export type GetCallbackPaymentStatusApiResponse = {
  Data: {
    CustomerReference?: string;
    InvoiceStatus?: string;
    InvoiceId?: string | number;
    InvoiceTransactions?: { Error?: string; ErrorCode?: string }[];
  };
};
export type UpdateCallbackPaymentApiArg = {
  id: string;
  transactionId: string;
  status: "pending" | "success" | "failed";
  reference: string;
};
export const {
  useGetCallbackPaymentStatusMutation,
  useUpdateCallbackPaymentMutation,
} = PaymentApi;
export default PaymentApi;
