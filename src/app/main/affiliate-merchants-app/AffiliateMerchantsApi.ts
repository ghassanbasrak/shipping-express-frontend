import { apiService as api } from "app/store/apiService";
import IAffiliateMerchant from "./models/IAffiliateMerchant";
import IAffiliateTransaction from "./models/IAffiliateTransaction";
import IAffiliateSummary from "./models/IAffiliateSummary";
import IMerchant from "../merchants-app/models/IMerchant";
export const addTagTypes = [
  "AffiliateMerchants",
  "AffiliateMerchant",
  "AffiliateSummary",
  "AffiliateCustomers",
  "AffiliateTransactions",
  "Merchants",
  "Merchant",
] as const;
const AffiliateMerchantsApi = api
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getAffiliateMerchants: build.query<
        GetAffiliateMerchantsApiResponse,
        GetAffiliateMerchantsApiArg
      >({
        query: (filters) => ({
          url: "v1/users",
          params: {
            role: "user",
            isAffiliate: true,
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
        providesTags: ["AffiliateMerchants"],
      }),

      getAffiliateMerchant: build.query<IAffiliateMerchant, string>({
        query: (id) => ({ url: `v1/users/${id}` }),
        providesTags: (_, __, id) => [{ type: "AffiliateMerchant", id }],
      }),
      getAffiliateSummary: build.query<IAffiliateSummary, string>({
        query: (affiliateId) => ({
          url: "v1/users/affiliates/summary",
          method: "POST",
          data: { affiliateId },
        }),
        providesTags: (_, __, id) => [{ type: "AffiliateSummary", id }],
      }),
      getAffiliateCustomers: build.query<
        GetAffiliateCustomersApiResponse,
        GetAffiliateCustomersApiArg
      >({
        query: (f) => ({
          url: "v1/users",
          params: {
            page: f.page,
            pageSize: 16,
            referredById: f.affiliateId,
            ...(f.searchText ? { search: f.searchText } : {}),
          },
        }),
        providesTags: (_, __, f) => [
          { type: "AffiliateCustomers", id: f.affiliateId },
        ],
      }),
      updateAffiliateCustomerPrices: build.mutation<
        IMerchant,
        UpdateAffiliateCustomerPricesApiArg
      >({
        query: (v) => ({
          url: `v1/users/${v.customerId}`,
          method: "PATCH",
          data: {
            loyaltyType: "custom",
            prices: v.prices.map((p) => ({
              shippingCompanyId: p.shippingCompanyId,
              affiliateId: v.affiliateId,
              ...(p.localPrice > 0 ? { localPrice: p.localPrice } : {}),
              ...(p.codPrice > 0 ? { codPrice: p.codPrice } : {}),
              ...(p.internationalDiscountRate > 0
                ? { internationalDiscountRate: p.internationalDiscountRate }
                : {}),
            })),
          },
        }),
        invalidatesTags: (_, __, v) => [
          { type: "AffiliateCustomers", id: v.affiliateId },
          { type: "AffiliateSummary", id: v.affiliateId },
          "Merchants",
          { type: "Merchant", id: v.customerId },
        ],
      }),
      getAffiliateTransactions: build.query<
        GetAffiliateTransactionsApiResponse,
        GetAffiliateTransactionsApiArg
      >({
        query: (f) => ({
          url: "v1/affiliate-transactions",
          params: {
            page: f.page,
            pageSize: f.pageSize,
            userId: f.userId,
            ...(f.searchText ? { search: f.searchText } : {}),
            ...(f.typeFilter && f.typeFilter !== "all"
              ? { type: f.typeFilter }
              : {}),
            ...(f.titleTypeFilter?.length
              ? { affiliateTransactionTitle: f.titleTypeFilter }
              : {}),
            ...(f.createdByIdFilter
              ? { createdById: f.createdByIdFilter }
              : {}),
            ...(f.dateFromFilter ? { dateFrom: f.dateFromFilter } : {}),
            ...(f.dateToFilter ? { dateTo: f.dateToFilter } : {}),
          },
          paramsSerializer: { indexes: null },
        }),
        providesTags: (_, __, f) => [
          { type: "AffiliateTransactions", id: f.userId },
        ],
      }),
    }),
  });
export type GetAffiliateMerchantsApiResponse = {
  results: IAffiliateMerchant[];
  total: number;
};
export type GetAffiliateMerchantsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  typeFilter?: string;
  balanceTypeFilter?: string;
  statusFilter?: string;
  verificationStatusFilter?: string;
  balanceSorting?: string;
  codBalanceSorting?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
};

export type GetAffiliateCustomersApiArg = {
  affiliateId: string;
  page: number;
  searchText?: string;
};
export type GetAffiliateCustomersApiResponse = {
  results: IMerchant[];
  total: number;
};
export type UpdateAffiliateCustomerPricesApiArg = {
  customerId: string;
  affiliateId: string;
  prices: {
    shippingCompanyId: string;
    localPrice?: number;
    codPrice?: number;
    internationalDiscountRate?: number;
  }[];
};
export type GetAffiliateTransactionsApiArg = {
  userId: string;
  page: number;
  pageSize: number;
  searchText?: string;
  typeFilter?: string;
  titleTypeFilter?: string[];
  createdByIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
};
export type GetAffiliateTransactionsApiResponse = {
  results: IAffiliateTransaction[];
  total: number;
};
export const {
  useGetAffiliateMerchantsQuery,
  useLazyGetAffiliateMerchantsQuery,
  useGetAffiliateMerchantQuery,
  useGetAffiliateSummaryQuery,
  useGetAffiliateCustomersQuery,
  useUpdateAffiliateCustomerPricesMutation,
  useGetAffiliateTransactionsQuery,
  useLazyGetAffiliateTransactionsQuery,
} = AffiliateMerchantsApi;
export default AffiliateMerchantsApi;
