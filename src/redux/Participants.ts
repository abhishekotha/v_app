import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ParticipantsType {
  userId: string;
  userName: string;
  isMuted: number;
  isVideoOn: number;
  imageUrl?: string;
  email: string;
}

const initialData: ParticipantsType[] = [];

const participantsSlice = createSlice({
  name: "participantsSlice",
  initialState: initialData,
  reducers: {
    appendData: (state, action: PayloadAction<ParticipantsType[]>) => {
      state.push(...action.payload);
    },

    insertData: (state, action: PayloadAction<ParticipantsType[]>) => {
      return [...action.payload];
    },

    changeMediaStatus: (
      state,
      action: PayloadAction<{
        status: number;
        type: string;
        userId: string;
      }>
    ) => {
      const user = state.find(
        (item) => item.userId === action.payload.userId
      );
      if (user) {
        if(action.payload.type === "video"){
          user.isVideoOn = action.payload.status;
        }
        else{
          user.isMuted = action.payload.status;
        }
      }
    },

    removeParticipant: (state, action: PayloadAction<string>) => {
      return state.filter(
        (item) => item.userId !== action.payload
      );
    },
  },
});

export default participantsSlice.reducer;

export const {
  appendData,
  insertData,
  changeMediaStatus,
  removeParticipant,
} = participantsSlice.actions;