import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";

export const adminsInitialState = {
  page: 0,
  pageSize: 10,
  searchText: "",
};
export const adminsAppSlice = createSlice({
  name: "adminsApp",
  initialState: adminsInitialState,
  reducers: {
    resetAdmins: () => adminsInitialState,
    newAdminsInstance: () => adminsInitialState,
    setAdminsPage: (state, action) => {
      state.page = action.payload || 0;
    },
    setAdminsPageSize: (state, action) => {
      state.pageSize = action.payload || 10;
      state.page = 0;
    },
    setAdminsSearchText: {
      reducer: (state, action) => {
        state.searchText = action.payload;
        state.page = 0;
      },
      prepare: (value) => ({ payload: value?.target?.value ?? value ?? "" }),
    },
  },
  selectors: {
    selectAdminsFilters: (state) => state,
    selectAdminsPage: (state) => state.page,
    selectAdminsPageSize: (state) => state.pageSize,
    selectAdminsSearchText: (state) => state.searchText,
  },
});
const injectedSlice = adminsAppSlice.injectInto(rootReducer);
export const {
  resetAdmins,
  newAdminsInstance,
  setAdminsPage,
  setAdminsPageSize,
  setAdminsSearchText,
} = adminsAppSlice.actions;
export const {
  selectAdminsFilters,
  selectAdminsPage,
  selectAdminsPageSize,
  selectAdminsSearchText,
} = injectedSlice.selectors;
export default adminsAppSlice.reducer;
