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

  };

  const createProducer = async ({type} : {type : string}) => {
      if(!producerTransport.current) return ;

      producerTransport.current.on("connect", async ({ dtlsParameters }, callback, errback) => {
          const result = await sfuSocket.emitWithAck("connectProducer", { dtlsParameters });
          if (result.status === "success") {
              callback();
          } else {
              errback(new Error("not working"));
          }
      });

      // produce
      producerTransport.current.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
          const result = await sfuSocket.emitWithAck("produce", {
              kind,
              rtpParameters,
          });
          if (result.status === "success") {
              callback({ id: result.data.producerId });
              if(type === "video"){
                sfuSocket.emit("unpause" , {kind : "video"});
                socket.emit("mediaChange" , {type : "video" , status : 1});
              }
              else{
                sfuSocket.emit("unpause" , {kind : "audio"});
                socket.emit("mediaChange" , {type : "audio" , status : 1});
              }
          } else {
              errback(new Error("Backend error"));
          }
      });

      const stream = await navigator.mediaDevices.getUserMedia({
          audio: type === "audio" ? true : false,
          video: type === "video" ? true : false,
      });
      streams.current[type] = stream;
      const track = stream.getTracks()[0];
      producers.current[type] = await producerTransport.current.produce({ track });

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