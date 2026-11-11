import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
const list = () => ({
  page: 0,
  pageSize: 10,
  searchText: "",
  warehouseId: "",
  status: "",
});
export const storageSlice = createSlice({
  name: "storageApp",
  initialState: {
    warehouses: list(),
    plans: list(),
    supplies: list(),
    products: list(),
  },
  reducers: {
    setStorageFilter(state, { payload: { list: name, field, value } }) {
      state[name][field] = value;
      if (field !== "page") state[name].page = 0;
    },
    resetStorageList(state, { payload: name }) {
      state[name] = list();
    },
  },
  selectors: { selectStorageLists: (state) => state },
});
const injected = storageSlice.injectInto(rootReducer);
export const { setStorageFilter, resetStorageList } = storageSlice.actions;
export const { selectStorageLists } = injected.selectors;
export default storageSlice.reducer;
