import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ParticipantsType {
  userId: string;
  userName: string;
  isMuted: number;
  isVideoOn: number;
  imageUrl?: string;
  email: string;
}

interface InitialStateType {
  participants: ParticipantsType[];
  isScreenShare: string;
}

const initialData: InitialStateType = {
  participants: [],
  isScreenShare: "",
};

const participantsSlice = createSlice({
  name: "participantsSlice",
  initialState: initialData,

  reducers: {
    appendData: (
      state,
      action: PayloadAction<ParticipantsType[]>
    ) => {
      state.participants.push(...action.payload);
    },

    insertData: (
      state,
      action: PayloadAction<ParticipantsType[]>
    ) => {
      state.participants = [...action.payload];
    },

    changeMediaStatus: (
      state,
      action: PayloadAction<{
        status: number;
        type: string;
        userId: string;
      }>
    ) => {
      const user = state.participants.find(
        (item) => item.userId === action.payload.userId
      );

      if (user) {
        if (action.payload.type === "video") {
          user.isVideoOn = action.payload.status;
        } else {
          user.isMuted = action.payload.status;
        }
      }
    },

    setScreenShare: (
      state,
      action: PayloadAction<string>
    ) => {
      state.isScreenShare = action.payload;
    },

    removeParticipant: (
      state,
      action: PayloadAction<string>
    ) => {
      state.participants = state.participants.filter(
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
  setScreenShare,
} = participantsSlice.actions;