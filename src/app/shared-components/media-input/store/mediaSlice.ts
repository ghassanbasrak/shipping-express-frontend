import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios, { AxiosProgressEvent } from "axios";

export const createMedia = createAsyncThunk<
  object,
  { userId: string; fileName: string }
>(
  "mediaInput/createMedia",
  async ({ userId, fileName }, { dispatch, getState, rejectWithValue }) => {
    const response = await axios.post(`v1/media/create`, {
      fileName,
      userId,
    });
    const data = await response.data;
    return data;
  },
);

export const uploadMedia = createAsyncThunk<
  object,
  {
    url: string;
    fields: any[];
    file: File;
    onUploadProgress: (progressEvent: AxiosProgressEvent) => void;
  }
>(
  "mediaInput/uploadMedia",
  async (
    { url, fields, file, onUploadProgress },
    { dispatch, getState, rejectWithValue },
  ) => {
    var bodyFormData = new FormData();

    for (var key in fields) {
      bodyFormData.append(key, fields[key]);
    }
    bodyFormData.append("file", file);
    const response = await axios({
      method: "post",
      url: url,
      data: bodyFormData,
      withCredentials: false,
      headers: {
        "Content-Type": "multipart/form-data",
        // "Access-Control-Allow-Headers": "Content-Type",
        // "Access-Control-Allow-Origin": "*",
        // "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Store-Id": undefined,
        Authorization: undefined,
      },
      onUploadProgress: onUploadProgress,
      baseURL: "/",
    });
    const data = await response.data;
    return data;
  },
);

const filterItemsSlice = createSlice({
  name: "mediaInput",
  initialState: {},
  reducers: {},
});

export default filterItemsSlice.reducer;
