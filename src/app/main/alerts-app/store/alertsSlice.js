import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const alertsInitialState = {
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
export const alertsAppSlice = createSlice({
  name: "alertsApp",
  initialState: alertsInitialState,
  reducers: {
    resetAlerts: () => alertsInitialState,
    newAlertsInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...alertsInitialState,
          userIdFilter: options?.userIdFilter || "all",
        },
      }),
    },

    setAlertsUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload || "all";
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setAlertsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setAlertsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setAlertsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setAlertsDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
    setAlertsDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
  },
  selectors: {
    selectAlertsFilters: (state) => state,
    selectAlertsPage: (state) => state.page,
    selectAlertsPageSize: (state) => state.pageSize,
    selectAlertsSearchText: (state) => state.searchText,
    selectAlertsDateFromFilter: (state) => state.dateFromFilter,
    selectAlertsDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = alertsAppSlice.injectInto(rootReducer);
export const {
  resetAlerts,
  newAlertsInstance,
  setAlertsUserIdFilter,
  setAlertsPage,
  setAlertsPageSize,
  setAlertsSearchText,
  setAlertsDateFromFilter,
  setAlertsDateToFilter,
} = alertsAppSlice.actions;
export const {
  selectAlertsFilters,
  selectAlertsPage,
  selectAlertsPageSize,
  selectAlertsSearchText,
  selectAlertsDateFromFilter,
  selectAlertsDateToFilter,
} = injectedSlice.selectors;
export default alertsAppSlice.reducer;
