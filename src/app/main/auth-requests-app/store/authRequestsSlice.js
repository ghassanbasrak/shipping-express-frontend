import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const authRequestsInitialState = {
  userIdFilter: "all",
  page: 0,
  pageSize: 10,
  searchText: "",
  statusFilter: "all",
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
export const authRequestsAppSlice = createSlice({
  name: "authRequestsApp",
  initialState: authRequestsInitialState,
  reducers: {
    resetAuthRequests: () => authRequestsInitialState,
    newAuthRequestsInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...authRequestsInitialState,
          userIdFilter: options?.userIdFilter || "all",
          statusFilter: options?.statusFilter || "all",
        },
      }),
    },

    setAuthRequestsUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload || "all";
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setAuthRequestsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setAuthRequestsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setAuthRequestsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setAuthRequestsStatusFilter: {
      reducer: (state, action) => {
        state.statusFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setAuthRequestsDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
    setAuthRequestsDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
  },
  selectors: {
    selectAuthRequestsFilters: (state) => state,
    selectAuthRequestsPage: (state) => state.page,
    selectAuthRequestsPageSize: (state) => state.pageSize,
    selectAuthRequestsSearchText: (state) => state.searchText,
    selectAuthRequestsStatusFilter: (state) => state.statusFilter,
    selectAuthRequestsDateFromFilter: (state) => state.dateFromFilter,
    selectAuthRequestsDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = authRequestsAppSlice.injectInto(rootReducer);
export const {
  resetAuthRequests,
  newAuthRequestsInstance,
  setAuthRequestsUserIdFilter,
  setAuthRequestsPage,
  setAuthRequestsPageSize,
  setAuthRequestsSearchText,
  setAuthRequestsStatusFilter,
  setAuthRequestsDateFromFilter,
  setAuthRequestsDateToFilter,
} = authRequestsAppSlice.actions;
export const {
  selectAuthRequestsFilters,
  selectAuthRequestsPage,
  selectAuthRequestsPageSize,
  selectAuthRequestsSearchText,
  selectAuthRequestsStatusFilter,
  selectAuthRequestsDateFromFilter,
  selectAuthRequestsDateToFilter,
} = injectedSlice.selectors;
export default authRequestsAppSlice.reducer;
