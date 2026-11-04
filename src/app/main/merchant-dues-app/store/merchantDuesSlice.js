import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
const valueOf = (event) => event?.target?.value ?? event;
export const merchantDuesInitialState = {
  instanceKey: "",
  page: 0,
  pageSize: 10,
  searchText: "",
  shippingCompanyIdFilter: "all",
  userIdFilter: "all",
  updatedByIdFilter: "",
  shipmentReceiverIdFilter: "",
  shipmentStatusFilters: [],
  shipmentPaymentStatusFilter: [],
  dateFromFilter: "",
  dateToFilter: "",
  dateFromInvalid: false,
  dateToInvalid: false,
};
const slice = createSlice({
  name: "merchantDuesApp",
  initialState: merchantDuesInitialState,
  reducers: {
    resetMerchantDues: () => merchantDuesInitialState,
    newMerchantDuesInstance: {
      reducer: (_, action) => ({
        ...merchantDuesInitialState,
        ...action.payload,
      }),
      prepare: (options) => ({ payload: options || {} }),
    },
    setMerchantDuesPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setMerchantDuesPageSize: (state, action) => {
      state.pageSize = valueOf(action.payload) || 10;
      state.page = 0;
    },
    setMerchantDuesSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "" }),
    },
    setMerchantDuesShippingCompanyIdFilter: {
      reducer: (state, action) => {
        state.shippingCompanyIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "all" }),
    },
    setMerchantDuesUserIdFilter: {
      reducer: (state, action) => {
        state.userIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "all" }),
    },
    setMerchantDuesUpdatedByIdFilter: {
      reducer: (state, action) => {
        state.updatedByIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "" }),
    },
    setMerchantDuesShipmentReceiverIdFilter: {
      reducer: (state, action) => {
        state.shipmentReceiverIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "" }),
    },
    setMerchantDuesShipmentStatusFilters: {
      reducer: (state, action) => {
        state.shipmentStatusFilters = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? [] }),
    },
    setMerchantDuesShipmentPaymentStatusFilter: {
      reducer: (state, action) => {
        state.shipmentPaymentStatusFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? [] }),
    },
    setMerchantDuesDateFromFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateFromInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateFromInvalid)
        state.dateFromFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
    setMerchantDuesDateToFilter: (state, action) => {
      const input = valueOf(action.payload),
        date = input ? new Date(input) : null;
      state.dateToInvalid = !!date && !Number.isFinite(date.getTime());
      if (!state.dateToInvalid)
        state.dateToFilter = date ? date.toISOString() : "";
      state.page = 0;
    },
  },
  selectors: { selectMerchantDuesFilters: (state) => state },
});
const injected = slice.injectInto(rootReducer);
export const {
  resetMerchantDues,
  newMerchantDuesInstance,
  setMerchantDuesPage,
  setMerchantDuesPageSize,
  setMerchantDuesSearchText,
  setMerchantDuesShippingCompanyIdFilter,
  setMerchantDuesUserIdFilter,
  setMerchantDuesUpdatedByIdFilter,
  setMerchantDuesShipmentReceiverIdFilter,
  setMerchantDuesShipmentStatusFilters,
  setMerchantDuesShipmentPaymentStatusFilter,
  setMerchantDuesDateFromFilter,
  setMerchantDuesDateToFilter,
} = slice.actions;
export const { selectMerchantDuesFilters } = injected.selectors;
export default slice.reducer;
