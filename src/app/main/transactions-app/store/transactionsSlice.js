import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
export const transactionsInitialState = {
  userIdFilter: "all",
  page: 0,
  pageSize: 10,
  searchText: "",
  typeFilter: "all",
  titleTypeFilter: [],
  relatedBalanceTypeFilter: "all",
  createdByIdFilter: "",
  dateFromFilter: "",
  dateToFilter: "",
  dateFromInvalid: false,
  dateToInvalid: false,
};
const initialState = transactionsInitialState;
const valueOf = (event) => event?.target?.value ?? event;
const slice = createSlice({
  name: "transactionsApp",
  initialState,
  reducers: {
    resetTransactions: () => initialState,
    newTransactionsInstance: {
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
    setTransactionsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setTransactionsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setTransactionsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setTransactionsUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setTransactionsCreatedByIdFilter: {
      reducer: (state, action) => {
        state.createdByIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setTransactionsTitleTypeFilter: {
      reducer: (state, action) => {
        state.titleTypeFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || [] }),
    },
    setTransactionsRelatedBalanceTypeFilter: {
      reducer: (state, action) => {
        state.relatedBalanceTypeFilter = action.payload;
        state.page = 0;
        state.titleTypeFilter = initialState.titleTypeFilter;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setTransactionsDateFromFilter: {
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
    setTransactionsDateToFilter: {
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
  selectors: { selectTransactionsFilters: (state) => state },
});
const injected = slice.injectInto(rootReducer);
export const {
  newTransactionsInstance,
  resetTransactions,
  setTransactionsPage,
  setTransactionsPageSize,
  setTransactionsSearchText,
  setTransactionsUserIdFilter,
  setTransactionsCreatedByIdFilter,
  setTransactionsTitleTypeFilter,
  setTransactionsRelatedBalanceTypeFilter,
  setTransactionsDateFromFilter,
  setTransactionsDateToFilter,
} = slice.actions;
export const { selectTransactionsFilters } = injected.selectors;
export default slice.reducer;
