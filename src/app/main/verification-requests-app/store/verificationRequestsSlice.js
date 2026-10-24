import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const verificationRequestsInitialState = {
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
export const verificationRequestsAppSlice = createSlice({
  name: "verificationRequestsApp",
  initialState: verificationRequestsInitialState,
  reducers: {
    resetVerificationRequests: () => verificationRequestsInitialState,
    newVerificationRequestsInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...verificationRequestsInitialState,
          userIdFilter: options?.userIdFilter || "all",
          statusFilter: options?.statusFilter || "all",
          updatedByIdFilter: options?.updatedByIdFilter || "",
        },
      }),
    },

    setVerificationRequestsUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload || "all";
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setVerificationRequestsUpdatedByIdFilter: {
      reducer: (state, action) => {
        state.updatedByIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setVerificationRequestsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setVerificationRequestsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setVerificationRequestsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setVerificationRequestsStatusFilter: {
      reducer: (state, action) => {
        state.statusFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setVerificationRequestsDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
    setVerificationRequestsDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
  },
  selectors: {
    selectVerificationRequestsFilters: (state) => state,
    selectVerificationRequestsPage: (state) => state.page,
    selectVerificationRequestsPageSize: (state) => state.pageSize,
    selectVerificationRequestsSearchText: (state) => state.searchText,
    selectVerificationRequestsStatusFilter: (state) => state.statusFilter,
    selectVerificationRequestsDateFromFilter: (state) => state.dateFromFilter,
    selectVerificationRequestsDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = verificationRequestsAppSlice.injectInto(rootReducer);
export const {
  resetVerificationRequests,
  newVerificationRequestsInstance,
  setVerificationRequestsUserIdFilter,
  setVerificationRequestsUpdatedByIdFilter,
  setVerificationRequestsPage,
  setVerificationRequestsPageSize,
  setVerificationRequestsSearchText,
  setVerificationRequestsStatusFilter,
  setVerificationRequestsDateFromFilter,
  setVerificationRequestsDateToFilter,
} = verificationRequestsAppSlice.actions;
export const {
  selectVerificationRequestsFilters,
  selectVerificationRequestsPage,
  selectVerificationRequestsPageSize,
  selectVerificationRequestsSearchText,
  selectVerificationRequestsStatusFilter,
  selectVerificationRequestsDateFromFilter,
  selectVerificationRequestsDateToFilter,
} = injectedSlice.selectors;
export default verificationRequestsAppSlice.reducer;
