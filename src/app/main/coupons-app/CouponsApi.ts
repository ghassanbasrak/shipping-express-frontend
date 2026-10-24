import _ from "lodash";
import { apiService as api } from "app/store/apiService";
import { PartialDeep } from "type-fest";
import ICoupon from "./models/ICoupon";
import { couponEditableFields } from "./models/CouponModel";
export const addTagTypes = ["Coupons", "Coupon"] as const;
const CouponsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getCoupons: build.query<GetCouponsApiResponse, GetCouponsApiArg>({
      query: (filters) => ({
        url: "v1/coupons",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.shippingCompanyIdFilter &&
          filters.shippingCompanyIdFilter !== "all"
            ? { shippingCompanyId: filters.shippingCompanyIdFilter }
            : {}),
          ...(filters.userIdFilter && filters.userIdFilter !== "all"
            ? { userId: filters.userIdFilter }
            : {}),
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
        },
      }),
      providesTags: ["Coupons"],
    }),
    getCoupon: build.query<GetCouponApiResponse, GetCouponApiArg>({
      query: (id) => ({ url: `v1/coupons/${id}` }),
      providesTags: (_, __, id) => [{ type: "Coupon", id }],
    }),
    createCoupon: build.mutation<CreateCouponApiResponse, CreateCouponApiArg>({
      query: (value) => ({
        url: "v1/coupons",
        method: "POST",
        data: _.pick(value, couponEditableFields),
      }),
      invalidatesTags: ["Coupons"],
    }),
    updateCoupon: build.mutation<UpdateCouponApiResponse, UpdateCouponApiArg>({
      query: (value) => ({
        url: `v1/coupons/${value.id}`,
        method: "PATCH",
        data: _.pick(value, couponEditableFields),
      }),
      invalidatesTags: (_, __, value) => [
        "Coupons",
        { type: "Coupon", id: value.id },
      ],
    }),
    removeCoupon: build.mutation<RemoveCouponApiResponse, RemoveCouponApiArg>({
      query: (id) => ({ url: `v1/coupons/${id}`, method: "DELETE" }),
      invalidatesTags: (_, __, id) => ["Coupons", { type: "Coupon", id }],
    }),
  }),
  overrideExisting: false,
});
export default CouponsApi;
export type GetCouponsApiResponse = { results: ICoupon[]; total: number };
export type GetCouponsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  shippingCompanyIdFilter?: string;
  userIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
};
export type GetCouponApiResponse = ICoupon;
export type GetCouponApiArg = string;
export type CreateCouponApiResponse = ICoupon;
export type CreateCouponApiArg = PartialDeep<ICoupon>;
export type UpdateCouponApiResponse = ICoupon;
export type UpdateCouponApiArg = Partial<ICoupon> & { id: string };
export type RemoveCouponApiResponse = unknown;
export type RemoveCouponApiArg = string;
export const {
  useGetCouponsQuery,
  useLazyGetCouponsQuery,
  useGetCouponQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useRemoveCouponMutation,
} = CouponsApi;
export type CouponsApiType = {
  [CouponsApi.reducerPath]: ReturnType<typeof CouponsApi.reducer>;
};
