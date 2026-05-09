import { io } from "socket.io-client";

const sfuSocket = io("http://localhost:5001" , {autoConnect : false , reconnection : false});

export const createSfuConnection = ({roomId , userId} : {roomId : String , userId : String}) =>{
    sfuSocket.auth = {roomId  , userId};
    sfuSocket.connect();

}


export default sfuSocket;