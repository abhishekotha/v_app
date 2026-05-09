import React, { useEffect } from "react";
import { io } from "socket.io-client";

const Testing  = () =>{

    useEffect(() =>{
        const socket = io("http://localhost:5000" , {reconnection : false});

        socket.on("disconnect" , () =>{
            console.log("I am disconnected");
        })
        
    },[])

    return(
        <div>
            Let test it
        </div>
    )
}

export default Testing;