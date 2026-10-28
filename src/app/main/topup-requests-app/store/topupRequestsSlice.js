import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
const valueOf = (event) => event?.target?.value ?? event;
export const topupRequestsInitialState = {
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
export const topupRequestsAppSlice = createSlice({
  name: "topupRequestsApp",
  initialState: topupRequestsInitialState,
  reducers: {
    resetTopupRequests: () => topupRequestsInitialState,
    newTopupRequestsInstance: (state, action) => ({
      ...topupRequestsInitialState,
      userIdFilter: action.payload?.userIdFilter || "all",
    }),
    setTopupRequestsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setTopupRequestsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setTopupRequestsSearchText: (state, action) => {
      state.searchText = valueOf(action.payload) || "";
      state.page = 0;
    },
    setTopupRequestsUserIdFilter: (state, action) => {
      state.userIdFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setTopupRequestsStatusFilter: (state, action) => {
      state.statusFilter = valueOf(action.payload) || "all";
      state.page = 0;
    },
    setTopupRequestsDateFromFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateFromInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateFromInvalid)
        state.dateFromFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
    setTopupRequestsDateToFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateToInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateToInvalid)
        state.dateToFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
  },
  selectors: { selectTopupRequestsFilters: (state) => state },
});
const injected = topupRequestsAppSlice.injectInto(rootReducer);
export const {
  resetTopupRequests,
  newTopupRequestsInstance,
  setTopupRequestsPage,
  setTopupRequestsPageSize,
  setTopupRequestsSearchText,
  setTopupRequestsUserIdFilter,
  setTopupRequestsStatusFilter,
  setTopupRequestsDateFromFilter,
  setTopupRequestsDateToFilter,
} = topupRequestsAppSlice.actions;
export const { selectTopupRequestsFilters } = injected.selectors;
export default topupRequestsAppSlice.reducer;
