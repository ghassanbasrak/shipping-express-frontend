import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
export const transactionReportsInitialState = {
  userIdFilter: "all",
  page: 0,
  pageSize: 10,
  searchText: "",
  typeFilter: "all",
  titleTypeFilter: "all",
  relatedBalanceTypeFilter: "wallet",
  createdByIdFilter: "",
  dateFromFilter: "",
  dateToFilter: "",
  dateFromInvalid: false,
  dateToInvalid: false,
};
const initialState = transactionReportsInitialState;
const valueOf = (event) => event?.target?.value ?? event;
const slice = createSlice({
  name: "transactionReportsApp",
  initialState,
  reducers: {
    resetTransactionReports: () => initialState,
    newTransactionReportsInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...initialState,
          userIdFilter: options?.userIdFilter || "all",
          relatedBalanceTypeFilter:
            options?.relatedBalanceTypeFilter ||
            initialState.relatedBalanceTypeFilter,
          createdByIdFilter: options?.createdByIdFilter || "",
        },
      }),
    },
    setTransactionReportsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setTransactionReportsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setTransactionReportsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setTransactionReportsUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setTransactionReportsCreatedByIdFilter: {
      reducer: (state, action) => {
        state.createdByIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setTransactionReportsTitleTypeFilter: {
      reducer: (state, action) => {
        state.titleTypeFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setTransactionReportsRelatedBalanceTypeFilter: {
      reducer: (state, action) => {
        state.relatedBalanceTypeFilter = action.payload;
        state.page = 0;
        state.titleTypeFilter = initialState.titleTypeFilter;
      },
      prepare: (event) => ({ payload: valueOf(event) || "wallet" }),
    },
    setTransactionReportsDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromInvalid = action.payload.invalid;
        if (!action.payload.invalid)
          state.dateFromFilter = action.payload.value;
        state.page = 0;
      },
      prepare: (date) => ({
        payload: {
          invalid: date instanceof Date && Number.isNaN(date.getTime()),
          value:
            date instanceof Date
              ? Number.isNaN(date.getTime())
                ? ""
                : date.toISOString()
              : date || "",
        },
      }),
    },
    setTransactionReportsDateToFilter: {
      reducer: (state, action) => {
        state.dateToInvalid = action.payload.invalid;
        if (!action.payload.invalid) state.dateToFilter = action.payload.value;
        state.page = 0;
      },
      prepare: (date) => ({
        payload: {
          invalid: date instanceof Date && Number.isNaN(date.getTime()),
          value:
            date instanceof Date
              ? Number.isNaN(date.getTime())
                ? ""
                : date.toISOString()
              : date || "",
        },
      }),
    },
  },
  selectors: { selectTransactionReportsFilters: (state) => state },
});
const injected = slice.injectInto(rootReducer);
export const {
  newTransactionReportsInstance,
  resetTransactionReports,
  setTransactionReportsPage,
  setTransactionReportsPageSize,
  setTransactionReportsSearchText,
  setTransactionReportsUserIdFilter,
  setTransactionReportsCreatedByIdFilter,
  setTransactionReportsTitleTypeFilter,
  setTransactionReportsRelatedBalanceTypeFilter,
  setTransactionReportsDateFromFilter,
  setTransactionReportsDateToFilter,
} = slice.actions;
export const { selectTransactionReportsFilters } = injected.selectors;
export default slice.reducer;
