import { apiService as api } from "app/store/apiService";
import IMerchant from "./models/IMerchant";
import IShipmentUser from "../shipment-users-app/models/IShipmentUser";
export const addTagTypes = [
  "AffiliateMerchants",
  "AffiliateMerchant",
  "AffiliateSummary",
  "AffiliateCustomers",
  "Merchants",
  "Merchant",
  "Transactions",
  "TransactionAccount",
  "ShipmentAccount",
  "TopupRequestsUser",
  "MerchantDuesSummary",
] as const;
const invalidates = (id: string) => [
  "AffiliateMerchants" as const,
  "AffiliateMerchant" as const,
  "AffiliateSummary" as const,
  "AffiliateCustomers" as const,
  "Merchants" as const,
  { type: "Merchant" as const, id },
  "Transactions" as const,
  "TransactionAccount" as const,
  "ShipmentAccount" as const,
  "TopupRequestsUser" as const,
  "MerchantDuesSummary" as const,
];
const MerchantsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getMerchants: build.query<GetMerchantsApiResponse, GetMerchantsApiArg>({
      query: (filters) => ({
        url: "v1/users",
        params: {
          role: "user",
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.balanceTypeFilter && filters.balanceTypeFilter !== "all"
            ? { balanceType: filters.balanceTypeFilter }
            : {}),
          ...(filters.typeFilter && filters.typeFilter !== "all"
            ? { loyaltyType: filters.typeFilter }
            : {}),
          ...(filters.statusFilter && filters.statusFilter !== "all"
            ? { active: filters.statusFilter }
            : {}),
          ...(filters.verificationStatusFilter &&
          filters.verificationStatusFilter !== "all"
            ? { verificationStatus: filters.verificationStatusFilter }
            : {}),
          ...(filters.hasStoreFilter && filters.hasStoreFilter !== "all"
            ? { hasStore: filters.hasStoreFilter }
            : {}),
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
          ...(["asc", "desc"].includes(filters.codBalanceSorting)
            ? {
                orderColumn: "codBalance",
                orderDirection: filters.codBalanceSorting,
              }
            : ["asc", "desc"].includes(filters.balanceSorting)
              ? {
                  orderColumn: "balance",
                  orderDirection: filters.balanceSorting,
                }
              : {}),
        },
      }),
      providesTags: ["Merchants"],
    }),
    getMerchant: build.query<IMerchant, string>({
      query: (id) => ({ url: `v1/users/${id}` }),
      providesTags: (_, __, id) => [{ type: "Merchant", id }],
    }),
    createMerchant: build.mutation<IMerchant, MerchantProfileApiArg>({
      query: (data) => ({ url: "v1/users", method: "POST", data }),
      invalidatesTags: ["Merchants"],
    }),
    updateMerchant: build.mutation<
      IMerchant,
      { id: string; data: MerchantProfileApiArg }
    >({
      query: (value) => ({
        url: `v1/users/${value.id}`,
        method: "PATCH",
        data: value.data,
      }),
      invalidatesTags: (_, __, value) => invalidates(value.id),
    }),
    setMerchantBlocked: build.mutation<
      IMerchant,
      { id: string; isBlocked: boolean }
    >({
      query: (value) => ({
        url: `v1/users/${value.id}`,
        method: "PATCH",
        data: { isBlocked: value.isBlocked },
      }),
      invalidatesTags: (_, __, value) => invalidates(value.id),
    }),
    setMerchantAffiliate: build.mutation<
      IMerchant,
      { id: string; isAffiliate: boolean }
    >({
      query: (value) => ({
        url: `v1/users/${value.id}`,
        method: "PATCH",
        data: { isAffiliate: value.isAffiliate },
      }),
      invalidatesTags: (_, __, value) => invalidates(value.id),
    }),
    convertMerchantToEmployee: build.mutation<IMerchant, string>({
      query: (id) => ({
        url: `v1/users/${id}`,
        method: "PATCH",
        data: { role: "employee" },
      }),
      invalidatesTags: (_, __, id) => invalidates(id),
    }),
    addMerchantPaymentPlan: build.mutation<
      unknown,
      { id: string; paymentPlanId: string }
    >({
      query: (value) => ({
        url: `v1/users/${value.id}/add-payment-plan`,
        method: "POST",
        data: { paymentPlanId: value.paymentPlanId },
      }),
      invalidatesTags: (_, __, value) => invalidates(value.id),
    }),
    cancelMerchantPaymentPlan: build.mutation<unknown, string>({
      query: (id) => ({
        url: `v1/users/${id}/cancel-payment-plan`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, id) => invalidates(id),
    }),
    closeMerchantBalance: build.mutation<
      CloseMerchantBalanceApiResponse,
      { id: string; type: string; notes?: string }
    >({
      query: (value) => ({
        url: "v1/transactions/close-balance",
        method: "POST",
        data: {
          userId: value.id,
          type: value.type,
          ...(value.notes ? { notes: value.notes } : {}),
        },
      }),
      invalidatesTags: (_, __, value) => invalidates(value.id),
    }),
    getMerchantContacts: build.query<
      GetMerchantContactsApiResponse,
      GetMerchantContactsApiArg
    >({
      query: (filters) => ({
        url: "v1/shipping-users",
        params: {
          userId: filters.userId,
          type: filters.type,
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export type MerchantProfileApiArg = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  phone1?: string;
  address?: {
    countryId?: string;
    stateId?: string;
    cityId?: string;
    street?: string;
    zipCode?: string;
  };
  taxNumber?: string;
  loyaltyType?: string;
  prices?: {
    shippingCompanyId?: string;
    localPrice?: number;
    codPrice?: number;
    internationalDiscountRate?: number;
  }[];
};
export type GetMerchantsApiResponse = { results: IMerchant[]; total: number };
export type GetMerchantsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  typeFilter?: string;
  balanceTypeFilter?: string;
  statusFilter?: string;
  verificationStatusFilter?: string;
  hasStoreFilter?: string;
  balanceSorting?: string;
  codBalanceSorting?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
};
export type CloseMerchantBalanceApiResponse = {
  walletBalanceStatus?: boolean;
  codBalanceStatus?: boolean;
};
export type GetMerchantContactsApiResponse = {
  results: IShipmentUser[];
  total: number;
};
export type GetMerchantContactsApiArg = {
  userId: string;
  type: string;
  page: number;
  pageSize: number;
  searchText?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
};
export const {
  useGetMerchantsQuery,
  useLazyGetMerchantsQuery,
  useGetMerchantQuery,
  useLazyGetMerchantQuery,
  useCreateMerchantMutation,
  useUpdateMerchantMutation,
  useSetMerchantBlockedMutation,
  useSetMerchantAffiliateMutation,
  useConvertMerchantToEmployeeMutation,
  useAddMerchantPaymentPlanMutation,
  useCancelMerchantPaymentPlanMutation,
  useCloseMerchantBalanceMutation,
  useGetMerchantContactsQuery,
  useLazyGetMerchantContactsQuery,
} = MerchantsApi;
export default MerchantsApi;
