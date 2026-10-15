import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const getCustomFreezedAutoCompleteItems = createAsyncThunk<
  any[],
  { getItemsUrl: string; searchBy?: string }
>(
  "customFreezedAutoComplete/getCustomFreezedAutoCompleteItems",
  async ({
    getItemsUrl,
    searchBy,
  }: {
    getItemsUrl: string;
    searchBy?: string;
  }) => {
    let url = getItemsUrl;
    if (searchBy) {
      url += `${url.includes("?") ? "&" : "?"}search=${searchBy}`;
    }
    const response = await axios.get(url);
    const data = await response.data;
    return data.results;
  }
);

export const getCustomFreezedAutoCompleteItem = createAsyncThunk<
  any | null,
  { getItemUrl: string; id: string }
>(
  "customFreezedAutoComplete/getCustomFreezedAutoCompleteItem",
  async ({ getItemUrl, id }) => {
    const response = await axios.get(`${getItemUrl}/${id}`);
    const data = await response.data;
    return data === undefined ? null : data;
  }
);

export const getCustomFreezedAutoCompleteItemsOneByOne = createAsyncThunk<
  any | null,
  { getItemUrl: string; ids: string[] }
>(
  "customFreezedAutoComplete/getCustomFreezedAutoCompleteItemsOneByOne",
  async ({ getItemUrl, ids }) => {
    const list = [];
    for (var i = 0; i < ids.length; i++) {
      const response = await axios.get(`${getItemUrl}/${ids[i]}`);
      const data = await response.data;
      list.push(data);
    }

    return list;
  }
);

const filterItemsSlice = createSlice({
  name: "customFreezedAutoComplete",
  initialState: {},
  reducers: {},
});

export default filterItemsSlice.reducer;
