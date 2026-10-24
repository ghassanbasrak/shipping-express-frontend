import _ from "lodash";
import { apiService as api } from "app/store/apiService";
import { PartialDeep } from "type-fest";
import { planEditableFields } from "./models/PlanModel";
import IPlan from "./models/IPlan";

export const addTagTypes = ["Plans", "Plan"] as const;
const PlansApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getPlans: build.query<GetPlansApiResponse, GetPlansApiArg>({
      query: (filters) => ({
        url: "v1/payment-plans",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
        },
      }),
      providesTags: ["Plans"],
    }),
    getPlan: build.query<GetPlanApiResponse, GetPlanApiArg>({
      query: (id) => ({ url: `v1/payment-plans/${id}` }),
      providesTags: (_, __, id) => [{ type: "Plan", id }],
    }),
    createPlan: build.mutation<CreatePlanApiResponse, CreatePlanApiArg>({
      query: (value) => ({
        url: "v1/payment-plans",
        method: "POST",
        data: _.pick(value, planEditableFields),
      }),
      invalidatesTags: ["Plans"],
    }),
    updatePlan: build.mutation<UpdatePlanApiResponse, UpdatePlanApiArg>({
      query: (value) => ({
        url: `v1/payment-plans/${value.id}`,
        method: "PATCH",
        data: _.pick(value, planEditableFields),
      }),
      invalidatesTags: (_, __, value) => [
        "Plans",
        { type: "Plan", id: value.id },
      ],
    }),
    removePlan: build.mutation<RemovePlanApiResponse, RemovePlanApiArg>({
      query: (id) => ({ url: `v1/payment-plans/${id}`, method: "DELETE" }),
      invalidatesTags: (_, __, id) => ["Plans", { type: "Plan", id }],
    }),
  }),
  overrideExisting: false,
});
export default PlansApi;
export type GetPlansApiResponse = { results: IPlan[]; total: number };
export type GetPlansApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
};
export type GetPlanApiResponse = IPlan;
export type GetPlanApiArg = string;
export type CreatePlanApiResponse = IPlan;
export type CreatePlanApiArg = PartialDeep<IPlan>;
export type UpdatePlanApiResponse = IPlan;
export type UpdatePlanApiArg = Partial<IPlan> & { id: string };
export type RemovePlanApiResponse = unknown;
export type RemovePlanApiArg = string;
export const {
  useGetPlansQuery,
  useLazyGetPlansQuery,
  useGetPlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useRemovePlanMutation,
} = PlansApi;
export type PlansApiType = {
  [PlansApi.reducerPath]: ReturnType<typeof PlansApi.reducer>;
};
