import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const citiesInitialState = {
  countryIdFilter: "all",
  stateIdFilter: "all",
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
export const citiesAppSlice = createSlice({
  name: "citiesApp",
  initialState: citiesInitialState,
  reducers: {
    resetCities: () => citiesInitialState,
    newCitiesInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...citiesInitialState,
          countryIdFilter: options?.countryIdFilter || "all",
          stateIdFilter: options?.stateIdFilter || "all",
          shippingCompanyIdFilter: options?.shippingCompanyIdFilter || "all",
        },
      }),
    },

    setCitiesCountryIdFilter: {
      reducer: (state, action) => {
        state.countryIdFilter = action.payload || "all";
        state.page = 0;
        state.stateIdFilter = "all";
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setCitiesStateIdFilter: {
      reducer: (state, action) => {
        state.stateIdFilter = action.payload || "all";
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setCitiesPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setCitiesPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setCitiesSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setCitiesShippingCompanyIdFilter: {
      reducer: (state, action) => {
        state.shippingCompanyIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setCitiesDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
    setCitiesDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
  },
  selectors: {
    selectCitiesFilters: (state) => state,
    selectCitiesPage: (state) => state.page,
    selectCitiesPageSize: (state) => state.pageSize,
    selectCitiesSearchText: (state) => state.searchText,
    selectCitiesShippingCompanyIdFilter: (state) =>
      state.shippingCompanyIdFilter,
    selectCitiesDateFromFilter: (state) => state.dateFromFilter,
    selectCitiesDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = citiesAppSlice.injectInto(rootReducer);
export const {
  resetCities,
  newCitiesInstance,
  setCitiesCountryIdFilter,
  setCitiesStateIdFilter,
  setCitiesPage,
  setCitiesPageSize,
  setCitiesSearchText,
  setCitiesShippingCompanyIdFilter,
  setCitiesDateFromFilter,
  setCitiesDateToFilter,
} = citiesAppSlice.actions;
export const {
  selectCitiesFilters,
  selectCitiesPage,
  selectCitiesPageSize,
  selectCitiesSearchText,
  selectCitiesShippingCompanyIdFilter,
  selectCitiesDateFromFilter,
  selectCitiesDateToFilter,
} = injectedSlice.selectors;
export default citiesAppSlice.reducer;
