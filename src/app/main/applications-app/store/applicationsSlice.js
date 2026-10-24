import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const applicationsInitialState = {
  userIdFilter: "all",
  page: 0,
  pageSize: 10,
  searchText: "",
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
export const applicationsAppSlice = createSlice({
  name: "applicationsApp",
  initialState: applicationsInitialState,
  reducers: {
    resetApplications: () => applicationsInitialState,
    newApplicationsInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...applicationsInitialState,
          userIdFilter: options?.userIdFilter || "all",
        },
      }),
    },

    setApplicationsUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload || "all";
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setApplicationsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setApplicationsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setApplicationsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setApplicationsDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
    setApplicationsDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
  },
  selectors: {
    selectApplicationsFilters: (state) => state,
    selectApplicationsPage: (state) => state.page,
    selectApplicationsPageSize: (state) => state.pageSize,
    selectApplicationsSearchText: (state) => state.searchText,
    selectApplicationsDateFromFilter: (state) => state.dateFromFilter,
    selectApplicationsDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = applicationsAppSlice.injectInto(rootReducer);
export const {
  resetApplications,
  newApplicationsInstance,
  setApplicationsUserIdFilter,
  setApplicationsPage,
  setApplicationsPageSize,
  setApplicationsSearchText,
  setApplicationsDateFromFilter,
  setApplicationsDateToFilter,
} = applicationsAppSlice.actions;
export const {
  selectApplicationsFilters,
  selectApplicationsPage,
  selectApplicationsPageSize,
  selectApplicationsSearchText,
  selectApplicationsDateFromFilter,
  selectApplicationsDateToFilter,
} = injectedSlice.selectors;
export default applicationsAppSlice.reducer;
