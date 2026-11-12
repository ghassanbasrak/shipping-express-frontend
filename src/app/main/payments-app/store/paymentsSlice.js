import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
const valueOf = (event) => event?.target?.value ?? event;
export const paymentsInitialState = {
  page: 0,
  pageSize: 10,
  searchText: "",
  userIdFilter: "all",
  statusFilter: "all",
  dateFromFilter: "",
  dateToFilter: "",
  dateFromInvalid: false,
  dateToInvalid: false,
};
export const paymentsAppSlice = createSlice({
  name: "paymentsApp",
  initialState: paymentsInitialState,
  reducers: {
    resetPayments: () => paymentsInitialState,
    newPaymentsInstance: (state, action) => ({
      ...paymentsInitialState,
      userIdFilter: action.payload?.userIdFilter || "all",
    }),
    setPaymentsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setPaymentsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setPaymentsSearchText: (state, action) => {
      state.searchText = valueOf(action.payload) || "";
      state.page = 0;
    },
    setPaymentsUserIdFilter: (state, action) => {
      state.userIdFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setPaymentsStatusFilter: (state, action) => {
      state.statusFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setPaymentsDateFromFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateFromInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateFromInvalid)
        state.dateFromFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
    setPaymentsDateToFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateToInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateToInvalid)
        state.dateToFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
  },
  selectors: { selectPaymentsFilters: (state) => state },
});
const injected = paymentsAppSlice.injectInto(rootReducer);
export const {
  resetPayments,
  newPaymentsInstance,
  setPaymentsPage,
  setPaymentsPageSize,
  setPaymentsSearchText,
  setPaymentsUserIdFilter,
  setPaymentsStatusFilter,
  setPaymentsDateFromFilter,
  setPaymentsDateToFilter,
} = paymentsAppSlice.actions;
export const { selectPaymentsFilters } = injected.selectors;
export default paymentsAppSlice.reducer;
