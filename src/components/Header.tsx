import React, { useState , useRef, useEffect } from "react";
import styles from "./styles/Header.module.css";
import { SideContentTypes } from "./Home";
import socket from "../utils/socket";
import * as mediasoup from "mediasoup-client";
import sfuSocket from "../utils/sfuSocket";

type Props = {
  setSideContent: React.Dispatch<React.SetStateAction<SideContentTypes>>;
  sideContent: SideContentTypes;
};

const Header: React.FC<Props> = ({ setSideContent, sideContent }) => {
  const [isMicOn, setIsMicOn] = useState<0 | 1>(0);
  const [isVideoOn, setIsVideoOn] = useState<0 | 1>(0);
  const device = useRef(new mediasoup.Device());
  const producerTransport = useRef<mediasoup.types.Transport | null>(null);
  const producers = useRef<Record<string , mediasoup.types.Producer>>({});
  const streams = useRef<Record<string , MediaStream>>({});
  const [screenShare , setScreenShare] = useState<number>(0);
  const screenShareStream = useRef<MediaStream | null>(null);
  const screenShareProducer = useRef<mediasoup.types.Producer | null>(null);
  const isScreenShareRef = useRef<boolean>(false);   // 👈 added
  const produceTypeRef = useRef<string>("");          // 👈 added

  const handleToggle = (type: SideContentTypes) => {
    setSideContent(prev => (prev === type ? "" : type));
  };

  const loadDevice = async () => {
      const routerRtpCapabilities = await sfuSocket.emitWithAck("rtpCapabilities");
      if (routerRtpCapabilities.status !== "success") return;

      if (!device.current.loaded) {
          await device.current.load({ routerRtpCapabilities: routerRtpCapabilities.data });
      }

      const transportParams = await sfuSocket.emitWithAck("createProducerTransporter");
      if (transportParams.status !== "success") return;
      producerTransport.current = device.current.createSendTransport(transportParams.data);

      producerTransport.current.on("connect", async ({ dtlsParameters }, callback, errback) => {
          const result = await sfuSocket.emitWithAck("connectProducer", { dtlsParameters });
          if (result.status === "success") {
              callback();
          } else {
              errback(new Error("not working"));
          }
      });

      producerTransport.current.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
          const isScreenShare = isScreenShareRef.current;
          const type = produceTypeRef.current;
          const result = await sfuSocket.emitWithAck("produce", {
              kind,
              rtpParameters,
              isScreenShare
          });
          if (result.status === "success") {
              callback({ id: result.data.producerId });
              if(isScreenShare){
                console.log("omekbkbeskjs");
                socket.emit("screenShare" , 1);
              }
              else{
                console.log("working fine");
                if(type === "video"){
                  sfuSocket.emit("unpause" , {kind : "video"});
                  socket.emit("mediaChange" , {type : "video" , status : 1});
                }
                else{
                  sfuSocket.emit("unpause" , {kind : "audio"});
                  socket.emit("mediaChange" , {type : "audio" , status : 1});
                }
              }
          } else {
              errback(new Error("Backend error"));
          }
      });

  };

  const createProducer = async ({type , isScreenShare = false} : {type : string , isScreenShare?: boolean}) => {
      if(!producerTransport.current) return ;


      isScreenShareRef.current = isScreenShare;
      produceTypeRef.current = type;

      if(!isScreenShare){
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: type === "audio" ? true : false,
            video: type === "video" ? true : false,
        });
        streams.current[type] = stream;
        const track = stream.getTracks()[0];
        producers.current[type] = await producerTransport.current.produce({ track });
      }
      else{
        try{
          const stream = await navigator.mediaDevices.getDisplayMedia({video : true});
          screenShareStream.current = stream;
          const track = stream.getTracks()[0];
          screenShareProducer.current = await producerTransport.current.produce({track});
          track.addEventListener("ended" , () =>{
            socket.emit("screenShare" , 0 );
          })
        } 
        catch(e){
          console.log("User is not given persmission");
          setScreenShare(0);
        }
      }

  };

  useEffect(() =>{
    loadDevice();
  },[])

  const toggleMic = () => {
    setIsMicOn(prev => {
      const newState: 0 | 1 = prev === 1 ? 0 : 1;

      if (newState === 1) {
        onMicEnable();
      } else {
        onMicDisable();
      }

      return newState;
    });
  };

  const toggleVideo = () => {
    setIsVideoOn(prev => {
      const newState: 0 | 1 = prev === 1 ? 0 : 1;

      if (newState === 1) {
        onVideoEnable();
      } else {
        onVideoDisable();
      }

      return newState;
    });
  };

  const onMicEnable = () => {
    createProducer({type : "audio"});
  };

  const onMicDisable = () => {
    socket.emit("mediaChange" , {type : "audio" , status : 0});
    streams.current["audio"].getAudioTracks().forEach((item) => item.stop());
  };

  const onVideoEnable = () => {
    createProducer({type : "video"});
  };

  const onVideoDisable = () => {
    socket.emit("mediaChange" , {type : "video" , status : 0});
    streams.current["video"].getVideoTracks().forEach((item) => item.stop());
  };

  const toggleScreenShare = () =>{
    if(screenShare === 1){
      setScreenShare(0);
      screenShareStream.current?.getTracks().forEach((item) => item.stop());
      socket.emit("screenShare" , 0 );
    } 
    else{
      setScreenShare(1);
      createProducer({"type" : "video" , isScreenShare : true});
    }
    
  }

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <span className={styles.logo}>🎥</span>
        <span className={styles.appName}>CallX</span>
      </div>

      <div className={styles.center}>
        <span className={styles.meetingName}>
          Team Sync Meeting
        </span>
      </div>

      <div className={styles.right}>
        <button
          onClick={toggleMic}
          className={`${styles.controlBtn} ${
            isMicOn === 0 ? styles.muted : ""
          }`}
        >
          {isMicOn === 1 ? "🎤" : "🔇"}
        </button>

        <button
          onClick={toggleVideo}
          className={`${styles.controlBtn} ${
            isVideoOn === 0 ? styles.muted : ""
          }`}
        >
          {isVideoOn === 1 ? "📹" : "🚫"}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`${styles.controlBtn} ${
            screenShare === 0 ? styles.muted : ""
          }`}
        >
          {screenShare === 1 ? "🖼️" : "🤙"}
        </button>

        <button
          onClick={() => handleToggle("CHAT")}
          className={`${styles.iconBtn} ${
            sideContent === "CHAT" ? styles.active : ""
          }`}
        >
          💬
        </button>

        <button
          onClick={() => handleToggle("PEOPLE")}
          className={`${styles.iconBtn} ${
            sideContent === "PEOPLE" ? styles.active : ""
          }`}
        >
          👥
        </button>

        <button
          onClick={() => handleToggle("SETTINGS")}
          className={`${styles.iconBtn} ${
            sideContent === "SETTINGS" ? styles.active : ""
          }`}
        >
          ⚙️
        </button>

        <button
          onClick={() => handleToggle("MORE")}
          className={`${styles.iconBtn} ${
            sideContent === "MORE" ? styles.active : ""
          }`}
        >
          ⋮
        </button>
      </div>
    </div>
  );
};

export default Header;