import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const packageRequestsInitialState = {
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
export const packageRequestsAppSlice = createSlice({
  name: "packageRequestsApp",
  initialState: packageRequestsInitialState,
  reducers: {
    resetPackageRequests: () => packageRequestsInitialState,
    newPackageRequestsInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...packageRequestsInitialState,
          userIdFilter: options?.userIdFilter || "all",
          statusFilter: options?.statusFilter || "all",
          updatedByIdFilter: options?.updatedByIdFilter || "",
        },
      }),
    },

    setPackageRequestsUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload || "all";
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setPackageRequestsUpdatedByIdFilter: {
      reducer: (state, action) => {
        state.updatedByIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setPackageRequestsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setPackageRequestsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setPackageRequestsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setPackageRequestsStatusFilter: {
      reducer: (state, action) => {
        state.statusFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setPackageRequestsDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
    setPackageRequestsDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
  },
  selectors: {
    selectPackageRequestsFilters: (state) => state,
    selectPackageRequestsPage: (state) => state.page,
    selectPackageRequestsPageSize: (state) => state.pageSize,
    selectPackageRequestsSearchText: (state) => state.searchText,
    selectPackageRequestsStatusFilter: (state) => state.statusFilter,
    selectPackageRequestsDateFromFilter: (state) => state.dateFromFilter,
    selectPackageRequestsDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = packageRequestsAppSlice.injectInto(rootReducer);
export const {
  resetPackageRequests,
  newPackageRequestsInstance,
  setPackageRequestsUserIdFilter,
  setPackageRequestsUpdatedByIdFilter,
  setPackageRequestsPage,
  setPackageRequestsPageSize,
  setPackageRequestsSearchText,
  setPackageRequestsStatusFilter,
  setPackageRequestsDateFromFilter,
  setPackageRequestsDateToFilter,
} = packageRequestsAppSlice.actions;
export const {
  selectPackageRequestsFilters,
  selectPackageRequestsPage,
  selectPackageRequestsPageSize,
  selectPackageRequestsSearchText,
  selectPackageRequestsStatusFilter,
  selectPackageRequestsDateFromFilter,
  selectPackageRequestsDateToFilter,
} = injectedSlice.selectors;
export default packageRequestsAppSlice.reducer;
