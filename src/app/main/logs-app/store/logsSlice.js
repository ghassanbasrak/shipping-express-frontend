import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
const valueOf = (event) => event?.target?.value ?? event;
export const logsInitialState = {
  page: 0,
  pageSize: 10,
  searchText: "",
  userIdFilter: "all",
  typeFilter: "all",
  dateFromFilter: "",
  dateToFilter: "",
  dateFromInvalid: false,
  dateToInvalid: false,
};
export const logsAppSlice = createSlice({
  name: "logsApp",
  initialState: logsInitialState,
  reducers: {
    resetLogs: () => logsInitialState,
    newLogsInstance: () => logsInitialState,
    setLogsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setLogsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setLogsSearchText: (state, action) => {
      state.searchText = valueOf(action.payload) || "";
      state.page = 0;
    },
    setLogsUserIdFilter: (state, action) => {
      state.userIdFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setLogsTypeFilter: (state, action) => {
      state.typeFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setLogsDateFromFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateFromInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateFromInvalid)
        state.dateFromFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
    setLogsDateToFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateToInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateToInvalid)
        state.dateToFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
  },
  selectors: { selectLogsFilters: (state) => state },
});
const injected = logsAppSlice.injectInto(rootReducer);
export const {
  resetLogs,
  newLogsInstance,
  setLogsPage,
  setLogsPageSize,
  setLogsSearchText,
  setLogsUserIdFilter,
  setLogsTypeFilter,
  setLogsDateFromFilter,
  setLogsDateToFilter,
} = logsAppSlice.actions;
export const { selectLogsFilters } = injected.selectors;
export default logsAppSlice.reducer;
