import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
const valueOf = (event) => event?.target?.value ?? event;
export const merchantsInitialState = {
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
export const merchantsAppSlice = createSlice({
  name: "merchantsApp",
  initialState: merchantsInitialState,
  reducers: {
    resetMerchants: () => merchantsInitialState,
    newMerchantsInstance: () => merchantsInitialState,
    setMerchantsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setMerchantsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setMerchantsSearchText: (state, action) => {
      state.searchText = valueOf(action.payload) || "";
      state.page = 0;
    },
    setMerchantsBalanceTypeFilter: (state, action) => {
      state.balanceTypeFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setMerchantsTypeFilter: (state, action) => {
      state.typeFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setMerchantsVerificationStatusFilter: (state, action) => {
      state.verificationStatusFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setMerchantsHasStoreFilter: (state, action) => {
      state.hasStoreFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setMerchantsBalanceSorting: (state, action) => {
      state.balanceSorting = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setMerchantsCodBalanceSorting: (state, action) => {
      state.codBalanceSorting = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setMerchantsStatusFilter: (state, action) => {
      state.statusFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setMerchantsDateFromFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateFromInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateFromInvalid)
        state.dateFromFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
    setMerchantsDateToFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateToInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateToInvalid)
        state.dateToFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
  },
  selectors: { selectMerchantsFilters: (state) => state },
});
const injected = merchantsAppSlice.injectInto(rootReducer);
export const {
  resetMerchants,
  newMerchantsInstance,
  setMerchantsPage,
  setMerchantsPageSize,
  setMerchantsSearchText,
  setMerchantsBalanceTypeFilter,
  setMerchantsTypeFilter,
  setMerchantsVerificationStatusFilter,
  setMerchantsHasStoreFilter,
  setMerchantsBalanceSorting,
  setMerchantsCodBalanceSorting,
  setMerchantsStatusFilter,
  setMerchantsDateFromFilter,
  setMerchantsDateToFilter,
} = merchantsAppSlice.actions;
export const { selectMerchantsFilters } = injected.selectors;
export default merchantsAppSlice.reducer;
