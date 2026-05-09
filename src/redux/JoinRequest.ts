import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface JoinRequestType {
    userId: string;
    socketId: string;
    status: "IDLE" | "PENDING" | "ACCEPTED" | "DECLINED";
    video : string;
    audio : string;
}

interface JoinRequestState {
    requests: JoinRequestType[];
}

const initialState: JoinRequestState = {
    requests: [],
};

const joinRequestSlice = createSlice({
    name: "joinRequest",
    initialState,
    reducers: {
        addRequest: (state, action: PayloadAction<JoinRequestType>) => {
            state.requests.push(action.payload);
        },

        appendrequests : (state , action : PayloadAction<JoinRequestType[]>) =>{
            state.requests.push(...action.payload);
        },

        updateRequestStatus: (
            state,
            action: PayloadAction<{ userId: string; status: JoinRequestType["status"] }>
        ) => {
            const req = state.requests.find(r => r.userId === action.payload.userId);
            if (req) {
                req.status = action.payload.status;
            }
        },

        removeRequest: (state, action: PayloadAction<string>) => {
            state.requests = state.requests.filter(
                r => r.userId !== action.payload
            );
        },

        clearRequests: (state) => {
            state.requests = [];
        }
    },
});

export const {
    addRequest,
    updateRequestStatus,
    removeRequest,
    clearRequests,
    appendrequests
} = joinRequestSlice.actions;

export default joinRequestSlice.reducer;