import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
    autoConnect : false
})

export const createConnection = ({roomId , userId} : {roomId : String , userId : String}) =>{
    socket.auth ={roomId , userId};
    socket.connect();
}

export default socket;