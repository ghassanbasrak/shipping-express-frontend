import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const bankTransfersInitialState = {
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
export const bankTransfersAppSlice = createSlice({
  name: "bankTransfersApp",
  initialState: bankTransfersInitialState,
  reducers: {
    resetBankTransfers: () => bankTransfersInitialState,
    newBankTransfersInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...bankTransfersInitialState,
          userIdFilter: options?.userIdFilter || "all",
          statusFilter: options?.statusFilter || "all",
          updatedByIdFilter: options?.updatedByIdFilter || "",
        },
      }),
    },

    setBankTransfersUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload || "all";
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setBankTransfersUpdatedByIdFilter: {
      reducer: (state, action) => {
        state.updatedByIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setBankTransfersPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setBankTransfersPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setBankTransfersSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setBankTransfersStatusFilter: {
      reducer: (state, action) => {
        state.statusFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setBankTransfersDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
    setBankTransfersDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
  },
  selectors: {
    selectBankTransfersFilters: (state) => state,
    selectBankTransfersPage: (state) => state.page,
    selectBankTransfersPageSize: (state) => state.pageSize,
    selectBankTransfersSearchText: (state) => state.searchText,
    selectBankTransfersStatusFilter: (state) => state.statusFilter,
    selectBankTransfersDateFromFilter: (state) => state.dateFromFilter,
    selectBankTransfersDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = bankTransfersAppSlice.injectInto(rootReducer);
export const {
  resetBankTransfers,
  newBankTransfersInstance,
  setBankTransfersUserIdFilter,
  setBankTransfersUpdatedByIdFilter,
  setBankTransfersPage,
  setBankTransfersPageSize,
  setBankTransfersSearchText,
  setBankTransfersStatusFilter,
  setBankTransfersDateFromFilter,
  setBankTransfersDateToFilter,
} = bankTransfersAppSlice.actions;
export const {
  selectBankTransfersFilters,
  selectBankTransfersPage,
  selectBankTransfersPageSize,
  selectBankTransfersSearchText,
  selectBankTransfersStatusFilter,
  selectBankTransfersDateFromFilter,
  selectBankTransfersDateToFilter,
} = injectedSlice.selectors;
export default bankTransfersAppSlice.reducer;
