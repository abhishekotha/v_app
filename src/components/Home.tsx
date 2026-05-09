import React, { useCallback, useEffect, useState } from "react";
import Header from "./Header";
import Participants from "./Paticipants";
import Chat from "./Chat";
import People from "./People";
import { createSfuConnection } from "../utils/sfuSocket";


import { useParams } from "react-router-dom";


export type SideContentTypes = "CHAT" | "PEOPLE" | "MORE" | "SETTINGS" | "";

const Home = () => {
    const { roomId, userId } = useParams();
    
    const [sideContent, setSideContent] = useState<SideContentTypes>("");

    const modules: Partial<Record<SideContentTypes, React.ReactNode>> = {
        CHAT: <Chat />,
        PEOPLE: <People />,
    };

    const init =  useCallback( async () => {
        createSfuConnection({
            roomId: roomId || "",
            userId: userId || "",
        });

    } , [roomId , userId]);

    useEffect(() => {
        init();
    }, [init]);

    return (
        <div style={{ width: "100vw", overflow: "hidden" }}>
            <Header setSideContent={setSideContent} sideContent={sideContent} />

            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    width: "120vw",
                    marginTop: 20,
                    marginLeft: 20,
                    gap: 20,
                }}
            >
                <div style={{ width: sideContent.length === 0 ? "110vw" : "70vw" }}>
                    <Participants />
                </div>

                <div style={{ width: "25vw" }}>
                    {modules[sideContent]}
                </div>
            </div>
        </div>
    );
};

export default Home;