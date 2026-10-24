import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const statesInitialState = {
  countryIdFilter: "all",
  page: 0,
  pageSize: 10,
  searchText: "",
  shippingCompanyIdFilter: "all",
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
export const statesAppSlice = createSlice({
  name: "statesApp",
  initialState: statesInitialState,
  reducers: {
    resetStates: () => statesInitialState,
    newStatesInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...statesInitialState,
          countryIdFilter: options?.countryIdFilter || "all",
          shippingCompanyIdFilter: options?.shippingCompanyIdFilter || "all",
        },
      }),
    },

    setStatesCountryIdFilter: {
      reducer: (state, action) => {
        state.countryIdFilter = action.payload || "all";
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setStatesPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setStatesPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setStatesSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setStatesShippingCompanyIdFilter: {
      reducer: (state, action) => {
        state.shippingCompanyIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setStatesDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
    setStatesDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
  },
  selectors: {
    selectStatesFilters: (state) => state,
    selectStatesPage: (state) => state.page,
    selectStatesPageSize: (state) => state.pageSize,
    selectStatesSearchText: (state) => state.searchText,
    selectStatesShippingCompanyIdFilter: (state) =>
      state.shippingCompanyIdFilter,
    selectStatesDateFromFilter: (state) => state.dateFromFilter,
    selectStatesDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = statesAppSlice.injectInto(rootReducer);
export const {
  resetStates,
  newStatesInstance,
  setStatesCountryIdFilter,
  setStatesPage,
  setStatesPageSize,
  setStatesSearchText,
  setStatesShippingCompanyIdFilter,
  setStatesDateFromFilter,
  setStatesDateToFilter,
} = statesAppSlice.actions;
export const {
  selectStatesFilters,
  selectStatesPage,
  selectStatesPageSize,
  selectStatesSearchText,
  selectStatesShippingCompanyIdFilter,
  selectStatesDateFromFilter,
  selectStatesDateToFilter,
} = injectedSlice.selectors;
export default statesAppSlice.reducer;
