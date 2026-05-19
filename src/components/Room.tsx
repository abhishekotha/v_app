
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket, { createConnection } from "../utils/socket";
import Home from "./Home";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import {
    JoinRequestType,
    appendrequests,
    removeRequest
} from "../redux/JoinRequest";
import { ParticipantsType , appendData, removeParticipant , setScreenShare} from "../redux/Participants";

import styles from "./styles/Room.module.css";

type Status = "IDLE" | "PENDING" | "ACCEPTED" | "DECLINED" | "ALREADY_JOIN";

const Room = () => {
    const { roomId, userId } = useParams();
    const dispatch = useDispatch();

    const [status, setStatus] = useState<Status>("IDLE");

    const requestData = useSelector(
        (state: RootState) => state.joinRequests.requests
    );

    const askPermission = useCallback(() => {
        socket.emit("ask-join");
        setStatus("PENDING");
    }, []);

    const handleAccept = (userId: string) => {
        socket.emit("accept-user", { acceptedUserId : userId });
        dispatch(removeRequest(userId));
    };

    const handleReject = (userId: string) => {
        socket.emit("reject-user", { rejectedUserId :  userId });
        dispatch(removeRequest(userId));
    };

    const socketOperations = useCallback(() => {

        socket.on("join-status", (status: Status) => {
            setStatus(status);
            console.log("This is the status come from the backend",status);
            if(status === "ACCEPTED"){
                const storeData : ParticipantsType= {userId : userId || "" , userName : userId || "" ,email : "Dummy@email.com" , isMuted : 0 , isVideoOn : 0 ,imageUrl : ""};
                dispatch(appendData([storeData]));
                socket.off("connect");
                socket.off("join-status");
            }
            else if(status === "ALREADY_JOIN"){
                socket.disconnect();
            }
        });

        socket.on("request-user-left" , ({userId}) =>{
            dispatch(removeRequest(userId));
        })

        socket.on("user-left" , ({userId}) =>{
            dispatch(removeParticipant(userId));
        })

        socket.on("all-users" , (data : JoinRequestType[]) =>{
            const roomData : ParticipantsType[] = [];
            data.forEach((item) =>{
                const storeData : ParticipantsType= {userId : item.userId , userName : item.userId ,email : "Dummy@email.com" , isMuted : parseInt(item.audio) , isVideoOn : parseInt(item.video) ,imageUrl : ""};
                if(userId !== item.userId){
                    roomData.push(storeData);
                }
            })
            dispatch(appendData(roomData));
            socket.off("all-users");
        });

        socket.on("screen-share" , (data) =>{
            dispatch(setScreenShare(data.userId));
        })

        socket.on("user-joined" , (data : JoinRequestType ) =>{
            console.log("user Joined" , data);
            const storeData : ParticipantsType= {userId : data.userId , userName : data.userId ,email : "Dummy@email.com" , isMuted : parseInt(data.audio) , isVideoOn : parseInt(data.video) ,imageUrl : ""};
            if(storeData.userId !== userId){
                dispatch(appendData([storeData]));
            }
        })

        socket.on("waiting-lobby", (data: JoinRequestType[]) => {
            console.log(data);
            dispatch(appendrequests(data));
        });

    }, [dispatch ,userId]);

    useEffect(() => {
        createConnection({
            roomId: roomId || "",
            userId: userId || ""
        });

        socketOperations();
        askPermission();

        return () => {
            socket.off("connect");
            socket.off("join-status");
            socket.off("waiting-lobby");
            socket.off("all-users");
        };
    }, [roomId, userId, socketOperations, askPermission]);

    return (
        <>
            {status === "ACCEPTED" ? (
                <div className={styles.container}>
                    <Home />

                    <div className={styles.sidebar}>
                        {requestData.map((item) => (
                            <div key={item.userId} className={styles.card}>
                                <div className={styles.header}>
                                    <span>{item.userId}</span>
                                    <span
                                        className={styles.close}
                                        onClick={() =>
                                            handleReject(item.userId)
                                        }
                                    >
                                        ❌
                                    </span>
                                </div>

                                <div className={styles.actions}>
                                    <button
                                        className={styles.accept}
                                        onClick={() =>
                                            handleAccept(item.userId)
                                        }
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className={styles.reject}
                                        onClick={() =>
                                            handleReject(item.userId)
                                        }
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className={styles.centerBox}>
                    {status === "PENDING" && (
                        <p>Waiting for admin approval...</p>
                    )}

                    {status === "DECLINED" && (
                        <>
                            <p>Request declined ❌</p>
                            <button onClick={askPermission}>
                                Ask Again
                            </button>
                        </>
                    )}

                    {status === "IDLE" && (
                        <button onClick={askPermission}>
                            Request to Join
                        </button>
                    )}
                    
                    {status === "ALREADY_JOIN" && (
                        <button>
                            Already In Metting with This Id
                        </button>
                    )}
                    
                </div>
            )}
        </>
    );
};

export default Room;