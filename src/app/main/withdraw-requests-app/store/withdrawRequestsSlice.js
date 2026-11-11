import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const withdrawRequestsInitialState = {
  userIdFilter: "all",
  page: 0,
  pageSize: 10,
  searchText: "",
  statusFilter: "all",
  updatedByIdFilter: "",
  dateFromFilter: "",
  dateToFilter: "",
  dateFromInvalid: false,
  dateToInvalid: false,
};
const valueOf = (event) => event?.target?.value ?? event;
const dateOf = (value) =>
  value instanceof Date
    ? Number.isNaN(value.getTime())
      ? ""
      : value.toISOString()
    : value || "";
export const withdrawRequestsAppSlice = createSlice({
  name: "withdrawRequestsApp",
  initialState: withdrawRequestsInitialState,
  reducers: {
    resetWithdrawRequests: () => withdrawRequestsInitialState,
    newWithdrawRequestsInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...withdrawRequestsInitialState,
          userIdFilter: options?.userIdFilter || "all",
          statusFilter: options?.statusFilter || "all",
          updatedByIdFilter: options?.updatedByIdFilter || "",
        },
      }),
    },

    setWithdrawRequestsUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload || "all";
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setWithdrawRequestsUpdatedByIdFilter: {
      reducer: (state, action) => {
        state.updatedByIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setWithdrawRequestsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setWithdrawRequestsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setWithdrawRequestsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setWithdrawRequestsStatusFilter: {
      reducer: (state, action) => {
        state.statusFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setWithdrawRequestsDateFromFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateFromInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateFromInvalid)
        state.dateFromFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
    setWithdrawRequestsDateToFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateToInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateToInvalid)
        state.dateToFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
  },
  selectors: {
    selectWithdrawRequestsFilters: (state) => state,
    selectWithdrawRequestsPage: (state) => state.page,
    selectWithdrawRequestsPageSize: (state) => state.pageSize,
    selectWithdrawRequestsSearchText: (state) => state.searchText,
    selectWithdrawRequestsStatusFilter: (state) => state.statusFilter,
    selectWithdrawRequestsDateFromFilter: (state) => state.dateFromFilter,
    selectWithdrawRequestsDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = withdrawRequestsAppSlice.injectInto(rootReducer);
export const {
  resetWithdrawRequests,
  newWithdrawRequestsInstance,
  setWithdrawRequestsUserIdFilter,
  setWithdrawRequestsUpdatedByIdFilter,
  setWithdrawRequestsPage,
  setWithdrawRequestsPageSize,
  setWithdrawRequestsSearchText,
  setWithdrawRequestsStatusFilter,
  setWithdrawRequestsDateFromFilter,
  setWithdrawRequestsDateToFilter,
} = withdrawRequestsAppSlice.actions;
export const {
  selectWithdrawRequestsFilters,
  selectWithdrawRequestsPage,
  selectWithdrawRequestsPageSize,
  selectWithdrawRequestsSearchText,
  selectWithdrawRequestsStatusFilter,
  selectWithdrawRequestsDateFromFilter,
  selectWithdrawRequestsDateToFilter,
} = injectedSlice.selectors;
export default withdrawRequestsAppSlice.reducer;
