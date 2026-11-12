import { createSlice } from "@reduxjs/toolkit";
import { rootReducer } from "app/store/lazyLoadedSlices";
const initialState = { searchText: "", status: "", page: 0, pageSize: 10 };
const slice = createSlice({
  name: "storageSubscriptionsApp",
  initialState,
  reducers: {
    setSubscriptionFilter(state, { payload: { field, value } }) {
      state[field] = value;
      if (field !== "page") state.page = 0;
    },
    resetSubscriptionFilters: () => initialState,
  },
  selectors: { selectSubscriptionFilters: (state) => state },
});
const injected = slice.injectInto(rootReducer);
export const { setSubscriptionFilter, resetSubscriptionFilters } =
  slice.actions;
export const { selectSubscriptionFilters } = injected.selectors;
export default slice.reducer;
