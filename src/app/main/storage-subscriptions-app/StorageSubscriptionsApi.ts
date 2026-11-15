import { apiService as api } from "app/store/apiService";
import type IStorageSubscription from "./models/IStorageSubscription";
import type IPayment from "../payments-app/models/IPayment";
import type { StorageSubscriptionOperation } from "./Utils";
export type StorageSubscriptionCheckoutArg = {
  planId: string;
  operation: StorageSubscriptionOperation;
};
export type AdminStorageSubscriptionArg = StorageSubscriptionCheckoutArg & {
  userId: string;
};
export type StoragePaymentResponse = IPayment;
export type StorageCheckoutResponse = {
  payment: StoragePaymentResponse;
  checkoutUrl: string | null;
  subscription?: IStorageSubscription;
};
const StorageSubscriptionsApi = api
  .enhanceEndpoints({
    addTagTypes: [
      "StorageSubscription",
      "StorageProducts",
      "Payments",
      "Payment",
      "PaymentsUser",
    ],
  })
  .injectEndpoints({
    endpoints: (build) => ({
      getStorageSubscription: build.query<IStorageSubscription | null, string>({
        query: () => ({ url: "v1/storage/subscriptions/current" }),
        providesTags: (_, __, id) => [{ type: "StorageSubscription", id }],
      }),
      subscribeStorage: build.mutation<
        StorageCheckoutResponse,
        StorageSubscriptionCheckoutArg
      >({
        query: (data) => ({
          url: "v1/storage/subscriptions/checkout",
          method: "POST",
          data,
        }),
        invalidatesTags: ["StorageSubscription", "Payments"],
      }),
      verifyStoragePayment: build.mutation<
        StoragePaymentResponse,
        { paymentId: string; userId: string }
      >({
        query: ({ paymentId }) => ({
          url: `v1/payments/${paymentId}/check-status`,
          method: "POST",
          data: {},
        }),
        invalidatesTags: (_, __, value) => [
          { type: "StorageSubscription", id: value.userId },
          "Payments",
          { type: "Payment", id: value.paymentId },
          "PaymentsUser",
        ],
      }),
      getStorageSubscriptions: build.query<
        IStorageSubscription[],
        { admin?: boolean; userId: string }
      >({
        query: ({ admin }) => ({
          url: admin
            ? "v1/storage/subscriptions/admin"
            : "v1/storage/subscriptions",
        }),
        providesTags: ["StorageSubscription"],
      }),
      createAdminStorageSubscription: build.mutation<
        IStorageSubscription,
        AdminStorageSubscriptionArg
      >({
        query: (data) => ({
          url: "v1/storage/subscriptions/admin",
          method: "POST",
          data,
        }),
        invalidatesTags: ["StorageSubscription", "Payments", "StorageProducts"],
      }),
    }),
  });
export const {
  useGetStorageSubscriptionQuery,
  useLazyGetStorageSubscriptionQuery,
  useSubscribeStorageMutation,
  useVerifyStoragePaymentMutation,
  useGetStorageSubscriptionsQuery,
  useCreateAdminStorageSubscriptionMutation,
} = StorageSubscriptionsApi;
export default StorageSubscriptionsApi;
