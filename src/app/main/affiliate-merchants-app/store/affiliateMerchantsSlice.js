import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
const valueOf = (event) => event?.target?.value ?? event;
export const affiliateMerchantsInitialState = {
  page: 0,
  pageSize: 10,
  searchText: "",
  balanceTypeFilter: "all",
  typeFilter: "all",
  verificationStatusFilter: "all",
  hasStoreFilter: "all",
  balanceSorting: "",
  codBalanceSorting: "",
  statusFilter: "all",
  dateFromFilter: "",
  dateToFilter: "",
  dateFromInvalid: false,
  dateToInvalid: false,
};
export const affiliateMerchantsAppSlice = createSlice({
  name: "affiliateMerchantsApp",
  initialState: affiliateMerchantsInitialState,
  reducers: {
    resetAffiliateMerchants: () => affiliateMerchantsInitialState,
    newAffiliateMerchantsInstance: () => affiliateMerchantsInitialState,
    setAffiliateMerchantsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setAffiliateMerchantsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setAffiliateMerchantsSearchText: (state, action) => {
      state.searchText = valueOf(action.payload) || "";
      state.page = 0;
    },
    setAffiliateMerchantsBalanceTypeFilter: (state, action) => {
      state.balanceTypeFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setAffiliateMerchantsTypeFilter: (state, action) => {
      state.typeFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setAffiliateMerchantsVerificationStatusFilter: (state, action) => {
      state.verificationStatusFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setAffiliateMerchantsHasStoreFilter: (state, action) => {
      state.hasStoreFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setAffiliateMerchantsBalanceSorting: (state, action) => {
      state.balanceSorting = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setAffiliateMerchantsCodBalanceSorting: (state, action) => {
      state.codBalanceSorting = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setAffiliateMerchantsStatusFilter: (state, action) => {
      state.statusFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setAffiliateMerchantsDateFromFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateFromInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateFromInvalid)
        state.dateFromFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
    setAffiliateMerchantsDateToFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateToInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateToInvalid)
        state.dateToFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
  },
  selectors: { selectAffiliateMerchantsFilters: (state) => state },
});
const injected = affiliateMerchantsAppSlice.injectInto(rootReducer);
export const {
  resetAffiliateMerchants,
  newAffiliateMerchantsInstance,
  setAffiliateMerchantsPage,
  setAffiliateMerchantsPageSize,
  setAffiliateMerchantsSearchText,
  setAffiliateMerchantsBalanceTypeFilter,
  setAffiliateMerchantsTypeFilter,
  setAffiliateMerchantsVerificationStatusFilter,
  setAffiliateMerchantsHasStoreFilter,
  setAffiliateMerchantsBalanceSorting,
  setAffiliateMerchantsCodBalanceSorting,
  setAffiliateMerchantsStatusFilter,
  setAffiliateMerchantsDateFromFilter,
  setAffiliateMerchantsDateToFilter,
} = affiliateMerchantsAppSlice.actions;
export const { selectAffiliateMerchantsFilters } = injected.selectors;
export default affiliateMerchantsAppSlice.reducer;
