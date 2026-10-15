import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const shippingCompaniesInitialState = {
  page: 0,
  pageSize: 16,
  searchText: "",
};
export const shippingCompaniesAppSlice = createSlice({
  name: "shippingCompaniesApp",
  initialState: shippingCompaniesInitialState,
  reducers: {
    resetShippingCompanies: () => shippingCompaniesInitialState,
    newShippingCompaniesInstance: () => shippingCompaniesInitialState,
    setShippingCompaniesPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setShippingCompaniesPageSize: (state, action) => {
      state.pageSize = action.payload || 16;
      state.page = 0;
    },
    setShippingCompaniesSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (value) => ({ payload: value?.target?.value ?? value ?? "" }),
    },
  },
  selectors: {
    selectShippingCompaniesFilters: (state) => state,
    selectShippingCompaniesPage: (state) => state.page,
    selectShippingCompaniesPageSize: (state) => state.pageSize,
    selectShippingCompaniesSearchText: (state) => state.searchText,
  },
});
const injectedSlice = shippingCompaniesAppSlice.injectInto(rootReducer);
export const {
  resetShippingCompanies,
  newShippingCompaniesInstance,
  setShippingCompaniesPage,
  setShippingCompaniesPageSize,
  setShippingCompaniesSearchText,
} = shippingCompaniesAppSlice.actions;
export const {
  selectShippingCompaniesFilters,
  selectShippingCompaniesPage,
  selectShippingCompaniesPageSize,
  selectShippingCompaniesSearchText,
} = injectedSlice.selectors;
export default shippingCompaniesAppSlice.reducer;
