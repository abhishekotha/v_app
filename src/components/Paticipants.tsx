import React, { useEffect, useState , useRef} from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ParticipantsType } from "../redux/Participants";
import styles from "./styles/Participants.module.css";
import * as mediasoup from "mediasoup-client";
import sfuSocket from "../utils/sfuSocket";
import socket from "../utils/socket";
import { changeMediaStatus , setScreenShare } from "../redux/Participants";
import { useDispatch } from "react-redux";

const Participants = () => {

  const dispatch = useDispatch();
  const allParticipants = useSelector(
    (state: RootState) => state.Participants.participants
  );

  const screenShareDatails = useSelector((state : RootState) => state.Participants.isScreenShare);

  const [filterData, setFilterData] = useState<ParticipantsType[]>([]);
  const [page, setPage] = useState<number>(1);
  const device = useRef(new mediasoup.Device());
  const videoRef = useRef<Record<string , HTMLVideoElement | null>>({});
  const streams = useRef<Record<string , MediaStream>>({});
  const consumerTransport = useRef<mediasoup.types.Transport | null>(null);
  const consumers = useRef<Record<string , mediasoup.types.Consumer>>({});
  const checker = useRef<Record<string , number>>({});
  const screenShareRef = useRef<HTMLVideoElement | null>(null);
  const screenShareStream = useRef<MediaStream | null>(null);

  const PAGE_SIZE = 6;

  const loadDevice = async () => {
      const routerRtpCapabilities = await sfuSocket.emitWithAck("rtpCapabilities");
      if (routerRtpCapabilities.status !== "success") return;

      if (!device.current.loaded) {
          await device.current.load({ routerRtpCapabilities: routerRtpCapabilities.data });
      }

      const transportParams = await sfuSocket.emitWithAck("createConsumerTransporter");
      if (transportParams.status !== "success") return;
      consumerTransport.current = device.current.createRecvTransport(transportParams.data);

      // 👇 moved here — registers only ONCE
      consumerTransport.current.on("connect", async ({ dtlsParameters }, callback, errback) => {
          const result = await sfuSocket.emitWithAck("connectConsumer", { dtlsParameters });
          if (result.status === "success") {
              callback();
          } else {
              errback(new Error("backend error"));
          }
      });
  };

  const createConsumer = async ({type , userId , isscreenShare = false} : {type : string , userId : string , isscreenShare? : boolean}) => {
      if(!consumerTransport.current) return ;

      // 👇 removed the on("connect") from here

      const consumerParams = await sfuSocket.emitWithAck("consume", {
          producerId: userId, kind: type,
          rtpCapabilities: device.current.rtpCapabilities,
          isScreenShare : isscreenShare
      });

      if (consumerParams.status !== "success") return;

      const consumer = await consumerTransport.current.consume({
          ...consumerParams.data,
          paused: false,
      });

      consumers.current[`${userId}-${type}`] = consumer;
      if(!isscreenShare){
        let stream = streams.current[`${userId}`];
  
        if (stream) {
          stream.addTrack(consumer.track);
        } else {
          stream = new MediaStream([consumer.track]);
          streams.current[`${userId}`] = stream;
        }
  
        const videoElement = videoRef.current[`${userId}`];
  
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }
      else{
        screenShareStream.current = new MediaStream([consumer.track]);
        if(screenShareRef.current){
          screenShareRef.current.srcObject = screenShareStream.current;
        }
      }

      sfuSocket.emit("unpauseConsume" , {"producerId" : userId , kind : type , isScreenShare :  isscreenShare });

  };

  const checkNewConsumer = async() =>{

    if(!device.current.loaded){
      await loadDevice();
    }

    for(let i = 0 ; i < filterData.length ; i++){
      let data = filterData[i];
      const userId = data.userId;
      const aCh = checker.current[`${userId}-audio`];
      const vCh = checker.current[`${userId}-video`];
      if(data.isMuted === 1 && !aCh){
        checker.current[`${userId}-audio`] = 1;
        await createConsumer({type : "audio" , userId : data.userId});
      }
      else if(data.isMuted === 0 && aCh){
        consumers.current[`${data.userId}-audio`]?.pause();
        delete checker.current[`${userId}-audio`];
        streams.current[`${userId}`].getAudioTracks().forEach((item) => {
          item.stop(); 
          streams.current[`${userId}`].removeTrack(item);
        });

      }

      if(data.isVideoOn === 1 && !vCh){
        checker.current[`${userId}-video`] = 1;
        await createConsumer({type : "video" , userId : data.userId});
      }
      else if(data.isVideoOn === 0 && vCh){
        consumers.current[`${data.userId}-video`]?.pause();
        delete checker.current[`${userId}-video`];
        streams.current[`${userId}`].getVideoTracks().forEach((item) => {
          item.stop();
          streams.current[`${userId}`].removeTrack(item);
        });
      }
    }
  }

  useEffect(() => {
    const filtered: ParticipantsType[] = [];
    const unfiltered: ParticipantsType[] = [];

    allParticipants.forEach((item) => {
      if (item.isMuted || item.isVideoOn) {
        filtered.push(item);
      } else {
        unfiltered.push(item);
      }
    });

    setFilterData([...filtered, ...unfiltered]);

  }, [allParticipants , dispatch]);

  useEffect(() =>{
    checkNewConsumer();
  },[filterData])

  useEffect(() =>{

    socket.on("mediaChange" , (data) =>{
        const {userId , type , status} = data;
        dispatch(changeMediaStatus({userId , type, status}));
    });

    socket.on("screenShare" , (data) =>{
      console.log(data);
      if(data.status === 1){
        dispatch(setScreenShare(data.userId));
        createConsumer({type : "video" , userId :  data.userId , isscreenShare : true});
      }
      else{ 
        dispatch(setScreenShare(""));
      }
    })

  },[dispatch])

  const paginatedData = filterData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Participants</h3>
      <div className={styles.grid}>
        {screenShareDatails.length > 0 && (
          <div className={styles.card}>
            <video ref={screenShareRef} autoPlay playsInline muted className={styles.video}/>
          </div>
        )}
        {paginatedData.map((user) => (
          <div key={user.userId} className={styles.card}>
            <div className={styles.menu}>⋮</div>

            {/* 👇 show avatar only when video is OFF */}
            {user.isVideoOn === 0 && (
              <div className={styles.avatar}>
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt={user.userName} />
                ) : (
                  <span>{user.userName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            )}

            {/* 👇 video always rendered (for ref), hidden when video is OFF */}
            <video
              ref={(el) => {videoRef.current[user.userId] = el}}
              autoPlay
              muted
              playsInline
              className={`${styles.video} ${user.isVideoOn === 0 ? styles.videoHidden : ""}`}
            />

            {/* 👇 name always at bottom */}
            <div className={styles.name}>{user.userName}</div>

            <div className={styles.status}>
              <span>{user.isMuted === 0 ? "🔇" : "🎤"}</span>
              <span>{user.isVideoOn === 0 ? "📹" : "🚫"}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.pagination}>
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>{page}</span>
        <button disabled={page * PAGE_SIZE >= filterData.length} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
};

export default Participants;