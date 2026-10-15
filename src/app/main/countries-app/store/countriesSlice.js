import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const countriesInitialState = {
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
export const countriesAppSlice = createSlice({
  name: "countriesApp",
  initialState: countriesInitialState,
  reducers: {
    resetCountries: () => countriesInitialState,
    newCountriesInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...countriesInitialState,
          shippingCompanyIdFilter: options?.shippingCompanyIdFilter || "all",
        },
      }),
    },
    setCountriesPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setCountriesPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setCountriesSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setCountriesShippingCompanyIdFilter: {
      reducer: (state, action) => {
        state.shippingCompanyIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setCountriesDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
    setCountriesDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
  },
  selectors: {
    selectCountriesFilters: (state) => state,
    selectCountriesPage: (state) => state.page,
    selectCountriesPageSize: (state) => state.pageSize,
    selectCountriesSearchText: (state) => state.searchText,
    selectCountriesShippingCompanyIdFilter: (state) =>
      state.shippingCompanyIdFilter,
    selectCountriesDateFromFilter: (state) => state.dateFromFilter,
    selectCountriesDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = countriesAppSlice.injectInto(rootReducer);
export const {
  resetCountries,
  newCountriesInstance,
  setCountriesPage,
  setCountriesPageSize,
  setCountriesSearchText,
  setCountriesShippingCompanyIdFilter,
  setCountriesDateFromFilter,
  setCountriesDateToFilter,
} = countriesAppSlice.actions;
export const {
  selectCountriesFilters,
  selectCountriesPage,
  selectCountriesPageSize,
  selectCountriesSearchText,
  selectCountriesShippingCompanyIdFilter,
  selectCountriesDateFromFilter,
  selectCountriesDateToFilter,
} = injectedSlice.selectors;
export default countriesAppSlice.reducer;
