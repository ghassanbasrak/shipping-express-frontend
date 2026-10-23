import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
export const shipmentUsersInitialState = {
  page: 0,
  pageSize: 16,
  searchText: "",
  typeFilter: "all",
};
export const shipmentUsersAppSlice = createSlice({
  name: "shipmentUsersApp",
  initialState: shipmentUsersInitialState,
  reducers: {
    newShipmentUsersInstance: {
      reducer: (_, action) => action.payload,
      prepare: (options) => ({
        payload: {
          ...shipmentUsersInitialState,
          typeFilter: options?.typeFilter || "all",
        },
      }),
    },
    resetShipmentUsers: () => shipmentUsersInitialState,
    setShipmentUsersPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setShipmentUsersPageSize: (state, action) => {
      state.pageSize = action.payload || 16;
      state.page = 0;
    },
    setShipmentUsersSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (value) => ({ payload: value?.target?.value ?? value ?? "" }),
    },
  },
  selectors: {
    selectShipmentUsersFilters: (state) => state,
    selectShipmentUsersSearchText: (state) => state.searchText,
  },
});
const injectedSlice = shipmentUsersAppSlice.injectInto(rootReducer);
export const {
  newShipmentUsersInstance,
  resetShipmentUsers,
  setShipmentUsersPage,
  setShipmentUsersPageSize,
  setShipmentUsersSearchText,
} = shipmentUsersAppSlice.actions;
export const { selectShipmentUsersFilters, selectShipmentUsersSearchText } =
  injectedSlice.selectors;
export default shipmentUsersAppSlice.reducer;
