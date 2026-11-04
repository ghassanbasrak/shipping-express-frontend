import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
const valueOf = (event) => event?.target?.value ?? event;
export const cancelShipmentRequestsInitialState = {
  instanceKey: "",
  page: 0,
  pageSize: 10,
  searchText: "",
  statusFilter: "all",
  userIdFilter: "all",
  updatedByIdFilter: "",
  dateFromFilter: "",
  dateToFilter: "",
  dateFromInvalid: false,
  dateToInvalid: false,
};
const slice = createSlice({
  name: "cancelShipmentRequestsApp",
  initialState: cancelShipmentRequestsInitialState,
  reducers: {
    resetCancelShipmentRequests: () => cancelShipmentRequestsInitialState,
    newCancelShipmentRequestsInstance: {
      reducer: (_, action) => ({
        ...cancelShipmentRequestsInitialState,
        ...action.payload,
      }),
      prepare: (options) => ({ payload: options || {} }),
    },
    setCancelShipmentRequestsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setCancelShipmentRequestsPageSize: (state, action) => {
      state.pageSize = valueOf(action.payload) || 10;
      state.page = 0;
    },
    setCancelShipmentRequestsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "" }),
    },
    setCancelShipmentRequestsStatusFilter: {
      reducer: (state, action) => {
        state.statusFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "all" }),
    },
    setCancelShipmentRequestsUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "all" }),
    },
    setCancelShipmentRequestsUpdatedByIdFilter: {
      reducer: (state, action) => {
        state.updatedByIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "" }),
    },
    setCancelShipmentRequestsDateFromFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateFromInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateFromInvalid)
        state.dateFromFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
    setCancelShipmentRequestsDateToFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateToInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateToInvalid)
        state.dateToFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
  },
  selectors: { selectCancelShipmentRequestsFilters: (state) => state },
});
const injected = slice.injectInto(rootReducer);
export const {
  resetCancelShipmentRequests,
  newCancelShipmentRequestsInstance,
  setCancelShipmentRequestsPage,
  setCancelShipmentRequestsPageSize,
  setCancelShipmentRequestsSearchText,
  setCancelShipmentRequestsStatusFilter,
  setCancelShipmentRequestsUserIdFilter,
  setCancelShipmentRequestsUpdatedByIdFilter,
  setCancelShipmentRequestsDateFromFilter,
  setCancelShipmentRequestsDateToFilter,
} = slice.actions;
export const { selectCancelShipmentRequestsFilters } = injected.selectors;
export default slice.reducer;
