import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const affiliateWithdrawRequestsInitialState = {
  userIdFilter: "all",
  page: 0,
  pageSize: 10,
  searchText: "",
  statusFilter: "all",
  updatedByIdFilter: "",
  dateFromFilter: "",
  dateToFilter: "",
};
const valueOf = (event) => event?.target?.value ?? event;
const dateOf = (value) =>
  value instanceof Date
    ? Number.isNaN(value.getTime())
      ? ""
      : value.toISOString()
    : value || "";
export const affiliateWithdrawRequestsAppSlice = createSlice({
  name: "affiliateWithdrawRequestsApp",
  initialState: affiliateWithdrawRequestsInitialState,
  reducers: {
    resetAffiliateWithdrawRequests: () => affiliateWithdrawRequestsInitialState,
    newAffiliateWithdrawRequestsInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...affiliateWithdrawRequestsInitialState,
          userIdFilter: options?.userIdFilter || "all",
          statusFilter: options?.statusFilter || "all",
          updatedByIdFilter: options?.updatedByIdFilter || "",
        },
      }),
    },

    setAffiliateWithdrawRequestsUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload || "all";
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setAffiliateWithdrawRequestsUpdatedByIdFilter: {
      reducer: (state, action) => {
        state.updatedByIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setAffiliateWithdrawRequestsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setAffiliateWithdrawRequestsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setAffiliateWithdrawRequestsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setAffiliateWithdrawRequestsStatusFilter: {
      reducer: (state, action) => {
        state.statusFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setAffiliateWithdrawRequestsDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
    setAffiliateWithdrawRequestsDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
  },
  selectors: {
    selectAffiliateWithdrawRequestsFilters: (state) => state,
    selectAffiliateWithdrawRequestsPage: (state) => state.page,
    selectAffiliateWithdrawRequestsPageSize: (state) => state.pageSize,
    selectAffiliateWithdrawRequestsSearchText: (state) => state.searchText,
    selectAffiliateWithdrawRequestsStatusFilter: (state) => state.statusFilter,
    selectAffiliateWithdrawRequestsDateFromFilter: (state) =>
      state.dateFromFilter,
    selectAffiliateWithdrawRequestsDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = affiliateWithdrawRequestsAppSlice.injectInto(rootReducer);
export const {
  resetAffiliateWithdrawRequests,
  newAffiliateWithdrawRequestsInstance,
  setAffiliateWithdrawRequestsUserIdFilter,
  setAffiliateWithdrawRequestsUpdatedByIdFilter,
  setAffiliateWithdrawRequestsPage,
  setAffiliateWithdrawRequestsPageSize,
  setAffiliateWithdrawRequestsSearchText,
  setAffiliateWithdrawRequestsStatusFilter,
  setAffiliateWithdrawRequestsDateFromFilter,
  setAffiliateWithdrawRequestsDateToFilter,
} = affiliateWithdrawRequestsAppSlice.actions;
export const {
  selectAffiliateWithdrawRequestsFilters,
  selectAffiliateWithdrawRequestsPage,
  selectAffiliateWithdrawRequestsPageSize,
  selectAffiliateWithdrawRequestsSearchText,
  selectAffiliateWithdrawRequestsStatusFilter,
  selectAffiliateWithdrawRequestsDateFromFilter,
  selectAffiliateWithdrawRequestsDateToFilter,
} = injectedSlice.selectors;
export default affiliateWithdrawRequestsAppSlice.reducer;
