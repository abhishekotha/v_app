import { configureStore } from "@reduxjs/toolkit";

import Participants from "./Participants";
import joinRequests from "./JoinRequest";

const store = configureStore({
    reducer: {
        Participants : Participants,
        joinRequests : joinRequests
    }
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;