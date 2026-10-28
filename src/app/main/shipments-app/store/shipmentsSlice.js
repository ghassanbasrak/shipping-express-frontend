import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
const valueOf = (event) => event?.target?.value ?? event;
export const shipmentsInitialState = {
  page: 0,
  pageSize: 10,
  searchText: "",
  viewType: "table",
  shippingCompanyIdFilter: "all",
  shippingTypeFilter: "all",
  shipmentTypeFilter: "all",
  isReturnedFilter: "all",
  statusFilters: [],
  paymentStatusFilter: [],
  merchantIdFilter: "",
  updatedByIdFilter: "",
  senderIdFilter: "",
  receiverIdFilter: "",
  closedInvoiceFilter: "all",
  dateFromFilter: "",
  dateToFilter: "",
};
const slice = createSlice({
  name: "shipmentsApp",
  initialState: shipmentsInitialState,
  reducers: {
    resetShipments: () => shipmentsInitialState,
    newShipmentsInstance: {
      reducer: (_, action) => ({ ...shipmentsInitialState, ...action.payload }),
      prepare: (options) => ({ payload: options || {} }),
    },
    setShipmentsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setShipmentsPageSize: {
      reducer: (state, action) => {
        state.pageSize = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? 10 }),
    },
    setShipmentsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "" }),
    },
    setShipmentsViewType: {
      reducer: (state, action) => {
        state.viewType = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "table" }),
    },
    setShipmentsShippingCompanyIdFilter: {
      reducer: (state, action) => {
        state.shippingCompanyIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "all" }),
    },
    setShipmentsShippingTypeFilter: {
      reducer: (state, action) => {
        state.shippingTypeFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "all" }),
    },
    setShipmentsShipmentTypeFilter: {
      reducer: (state, action) => {
        state.shipmentTypeFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "all" }),
    },
    setShipmentsIsReturnedFilter: {
      reducer: (state, action) => {
        state.isReturnedFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "all" }),
    },
    setShipmentsStatusFilters: {
      reducer: (state, action) => {
        state.statusFilters = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? [] }),
    },
    setShipmentsPaymentStatusFilter: {
      reducer: (state, action) => {
        state.paymentStatusFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? [] }),
    },
    setShipmentsMerchantIdFilter: {
      reducer: (state, action) => {
        state.merchantIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "" }),
    },
    setShipmentsUpdatedByIdFilter: {
      reducer: (state, action) => {
        state.updatedByIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "" }),
    },
    setShipmentsSenderIdFilter: {
      reducer: (state, action) => {
        state.senderIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "" }),
    },
    setShipmentsReceiverIdFilter: {
      reducer: (state, action) => {
        state.receiverIdFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "" }),
    },
    setShipmentsClosedInvoiceFilter: {
      reducer: (state, action) => {
        state.closedInvoiceFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({ payload: valueOf(event) ?? "all" }),
    },
    setShipmentsDateFromFilter: {
      reducer: (state, action) => {
        state.dateFromFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({
        payload:
          event instanceof Date
            ? Number.isNaN(event.getTime())
              ? ""
              : event.toISOString()
            : event || "",
      }),
    },
    setShipmentsDateToFilter: {
      reducer: (state, action) => {
        state.dateToFilter = action.payload;
        state.page = 0;
      },
      prepare: (event) => ({
        payload:
          event instanceof Date
            ? Number.isNaN(event.getTime())
              ? ""
              : event.toISOString()
            : event || "",
      }),
    },
  },
  selectors: { selectShipmentsFilters: (state) => state },
});
const injected = slice.injectInto(rootReducer);
export const {
  newShipmentsInstance,
  resetShipments,
  setShipmentsPage,
  setShipmentsPageSize,
  setShipmentsSearchText,
  setShipmentsViewType,
  setShipmentsShippingCompanyIdFilter,
  setShipmentsShippingTypeFilter,
  setShipmentsShipmentTypeFilter,
  setShipmentsIsReturnedFilter,
  setShipmentsStatusFilters,
  setShipmentsPaymentStatusFilter,
  setShipmentsMerchantIdFilter,
  setShipmentsUpdatedByIdFilter,
  setShipmentsSenderIdFilter,
  setShipmentsReceiverIdFilter,
  setShipmentsClosedInvoiceFilter,
  setShipmentsDateFromFilter,
  setShipmentsDateToFilter,
} = slice.actions;
export const { selectShipmentsFilters } = injected.selectors;
export default slice.reducer;
