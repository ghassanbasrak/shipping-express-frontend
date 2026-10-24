import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const couponsInitialState = {
  userIdFilter: "all",
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
export const couponsAppSlice = createSlice({
  name: "couponsApp",
  initialState: couponsInitialState,
  reducers: {
    resetCoupons: () => couponsInitialState,
    newCouponsInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...couponsInitialState,
          userIdFilter: options?.userIdFilter || "all",
          shippingCompanyIdFilter: options?.shippingCompanyIdFilter || "all",
        },
      }),
    },

    setCouponsUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload || "all";
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setCouponsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setCouponsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setCouponsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "" }),
    },
    setCouponsShippingCompanyIdFilter: {
      reducer: (state, action) => {
        state.shippingCompanyIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) || "all" }),
    },
    setCouponsDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
    setCouponsDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (date) => ({ payload: dateOf(date) }),
    },
  },
  selectors: {
    selectCouponsFilters: (state) => state,
    selectCouponsPage: (state) => state.page,
    selectCouponsPageSize: (state) => state.pageSize,
    selectCouponsSearchText: (state) => state.searchText,
    selectCouponsShippingCompanyIdFilter: (state) =>
      state.shippingCompanyIdFilter,
    selectCouponsDateFromFilter: (state) => state.dateFromFilter,
    selectCouponsDateToFilter: (state) => state.dateToFilter,
  },
});
const injectedSlice = couponsAppSlice.injectInto(rootReducer);
export const {
  resetCoupons,
  newCouponsInstance,
  setCouponsUserIdFilter,
  setCouponsPage,
  setCouponsPageSize,
  setCouponsSearchText,
  setCouponsShippingCompanyIdFilter,
  setCouponsDateFromFilter,
  setCouponsDateToFilter,
} = couponsAppSlice.actions;
export const {
  selectCouponsFilters,
  selectCouponsPage,
  selectCouponsPageSize,
  selectCouponsSearchText,
  selectCouponsShippingCompanyIdFilter,
  selectCouponsDateFromFilter,
  selectCouponsDateToFilter,
} = injectedSlice.selectors;
export default couponsAppSlice.reducer;
