import React, { useEffect, useState , useRef} from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ParticipantsType } from "../redux/Participants";
import styles from "./styles/Participants.module.css";
import * as mediasoup from "mediasoup-client";
import sfuSocket from "../utils/sfuSocket";
import socket from "../utils/socket";
import { changeMediaStatus } from "../redux/Participants";
import { useDispatch } from "react-redux";

const Participants = () => {

  const dispatch = useDispatch();
  const allParticipants = useSelector(
    (state: RootState) => state.Participants
  );

  const [filterData, setFilterData] = useState<ParticipantsType[]>([]);
  const [page, setPage] = useState<number>(1);
  const device = useRef(new mediasoup.Device());
  const videoRef = useRef<Record<string , HTMLVideoElement | null>>({});
  const streams = useRef<Record<string , MediaStream>>({});
  const consumerTransport = useRef<mediasoup.types.Transport | null>(null);
  const consumers = useRef<Record<string , mediasoup.types.Consumer>>({});
  const checker = useRef<Record<string , number>>({});

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
  };

  const createConsumer = async ({type , userId} : {type : string , userId : string}) => {
      if(!consumerTransport.current) return ;
      consumerTransport.current.on("connect", async ({ dtlsParameters }, callback, errback) => {
          const result = await sfuSocket.emitWithAck("connectConsumer", { dtlsParameters });
          if (result.status === "success") {
              callback();
          } else {
              errback(new Error("backend error"));
          }
      });

      const consumerParams = await sfuSocket.emitWithAck("consume", {
          producerId: userId, kind: type,
          rtpCapabilities: device.current.rtpCapabilities,
      });

      if (consumerParams.status !== "success") return;

      const consumer = await consumerTransport.current.consume({
          ...consumerParams.data,
          paused: false,
      });

      consumers.current[`${userId}-${type}`] = consumer;

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

      sfuSocket.emit("unpauseConsume" , {"producerId" : userId , kind : type });

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
        console.log("new change agaya" , userId , type , status);
        dispatch(changeMediaStatus({userId , type, status}));
    });
  },[dispatch])

  const paginatedData = filterData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Participants</h3>

      <div className={styles.grid}>
        {paginatedData.map((user) => (
          <div key={user.userId} className={styles.card}>
            <div className={styles.menu}>⋮</div>

            <div className={styles.avatar}>
              {user.imageUrl ? (
                <img src={user.imageUrl} alt={user.userName} />
              ) : (
                <span>
                  {user.userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className={styles.name}>{user.userName}</div>
            <video ref={(el) => {videoRef.current[user.userId] = el}} autoPlay muted playsInline  style={{width : 200 , height : 200 , background : "black"}}/>
            <div className={styles.status}>
              <span>{user.isMuted === 0 ? "🔇" : "🎤"}</span>
              <span>{user.isVideoOn === 0 ? "📹" : "🚫"}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.pagination}>
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>

        <span>{page}</span>

        <button
          disabled={page * PAGE_SIZE >= filterData.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Participants;