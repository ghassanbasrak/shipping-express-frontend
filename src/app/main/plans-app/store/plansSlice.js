import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const plansInitialState = {
  page: 0,
  pageSize: 16,
  searchText: "",
};
export const plansAppSlice = createSlice({
  name: "plansApp",
  initialState: plansInitialState,
  reducers: {
    resetPlans: () => plansInitialState,
    newPlansInstance: () => plansInitialState,
    setPlansPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setPlansPageSize: (state, action) => {
      state.pageSize = action.payload || 16;
      state.page = 0;
    },
    setPlansSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (value) => ({ payload: value?.target?.value ?? value ?? "" }),
    },
  },
  selectors: {
    selectPlansFilters: (state) => state,
    selectPlansPage: (state) => state.page,
    selectPlansPageSize: (state) => state.pageSize,
    selectPlansSearchText: (state) => state.searchText,
  },
});
const injectedSlice = plansAppSlice.injectInto(rootReducer);
export const {
  resetPlans,
  newPlansInstance,
  setPlansPage,
  setPlansPageSize,
  setPlansSearchText,
} = plansAppSlice.actions;
export const {
  selectPlansFilters,
  selectPlansPage,
  selectPlansPageSize,
  selectPlansSearchText,
} = injectedSlice.selectors;
export default plansAppSlice.reducer;
