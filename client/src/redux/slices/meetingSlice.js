import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getApi, postApi } from "services/api";

export const fetchMeetingData = createAsyncThunk(
  "fetchMeetingData",
  async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
      console.log(user.role);
      const response = await getApi(
        user.role === "superAdmin"
          ? "api/meeting"
          : `api/meeting/?createBy=${user._id}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
);

export const fetchMeetingAddData = createAsyncThunk(
  "fetchMeetingAddData",
  async (value) => {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
      console.log(value);
      const response = await postApi("api/meeting/add", {
        ...value,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
);

const meetingSlice = createSlice({
  name: "meetingData",
  initialState: {
    data: [],
    isLoading: false,
    error: "",
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeetingData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMeetingData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
        state.error = "";
      })
      .addCase(fetchMeetingData.rejected, (state, action) => {
        state.isLoading = false;
        state.data = [];
        state.error = action.error.message;
      });
  },
});

export default meetingSlice.reducer;
