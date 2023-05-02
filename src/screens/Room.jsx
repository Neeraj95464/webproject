import React ,{useEffect , useCallback,useState} from "react";
import ReactPlayer from 'react-player';
import peer from '../service/peer';
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {

const socket = useSocket();
const [remoteSocketId, setRemoteSocketId] = useState(null);
const [myStream, setMyStream] = useState(null);
const [remoteStream, setRemoteStream] =useState();

const handleUserJoined= useCallback( ({email,id}) => {
console.log('Email  joined the Room '+ email);
        setRemoteSocketId(id);
},[]);

const handleCallUser= useCallback( async() => {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio:true,
        video:true,
    });

    const offer =await peer.getOffer();
    socket.emit("user:call",{to : remoteSocketId , offer});
    setMyStream(stream);
},[remoteSocketId , socket]);

const handleIncommingCall = useCallback(
    async({from,offer}) => {
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
        audio:true,
        video:true,
    });
    setMyStream(stream);
    console.log('Incomming Call ',from ,offer);
    const ans = await peer.getAnswer(offer);
    socket.emit('call:accepted', {to : from, ans});
}, [socket]);

const sendStream =useCallback (() =>{
    for (const track of myStream.getTracks()){
        peer.peer.addTrack(track,myStream);
    }
},[myStream]);

const handleCallAccepted = useCallback (
    ({from , ans}) => {
    peer.setLocalDescription(ans);
    console.log('Call Accepted!');
    sendStream()
} ,[sendStream]);

const handleNegoNeeded=useCallback(async () => {
    const offer= await peer.getOffer();
    socket.emit('peer:nego:needed',{offer,to: remoteSocketId});
},[remoteSocketId,socket]);

useEffect (() => {
    peer.peer.addEventListener('negotiationneeded',handleNegoNeeded);
    return () => {
        peer.peer.removeEventListener("negotiationneeded",handleNegoNeeded);
    };
},[handleNegoNeeded]);

const handleNegoNeedIncomming =useCallback (async ({from,offer}) => {
    const ans =await peer.getAnswer(offer);
    socket.emit("peer:nego:done",{to:from,ans});
},[socket]);

const handleNegoNeedFinal=useCallback (async({ans}) =>{
    await peer.setLocalDescription(ans)
},[])

useEffect(() => {
    peer.peer.addEventListener("track",async ev =>{
        const remoteStream =ev.streams;
        console.log("Got TRacks!! ");
        setRemoteStream(remoteStream[0]);
    });
},[]);

useEffect(() => {
    socket.on('user:joined', handleUserJoined);
    socket.on('incomming:call', handleIncommingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('peer:nego:needed',handleNegoNeedIncomming);
    socket.on('peer:nego:final',handleNegoNeedFinal);

    return () => {
        socket.off('user:joined', handleUserJoined);
        socket.off('incomming:call', handleIncommingCall);
        socket.off('call:accepted', handleCallAccepted);
        socket.off('peer:nego:needed',handleNegoNeedIncomming);
        socket.off('peer:nego:final',handleNegoNeedFinal);
    };
}, [socket, handleUserJoined, handleIncommingCall,handleCallAccepted,handleNegoNeedIncomming,handleNegoNeedFinal]);


    return (
        <>
        <div>
            <h1> Room Page </h1>
            <h4>{remoteSocketId ? "Connected" : " No One in the Room"}</h4>
            {myStream && <button onClick={sendStream}>Send Stream</button>}
            {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
            {
                myStream && (
                    <>
                <h1>my Stream</h1>
                <ReactPlayer playing muted height="100px" width="200px" url ={myStream}/>
                </>
                ) 
            }
            {
                remoteStream && (
                    <>
                <h1>Remote Stream</h1>
                <ReactPlayer playing muted height="100px" width="200px" url ={remoteStream}/>
                </>
                ) 
            }
        </div>
        </>
    );
};

export default RoomPage;