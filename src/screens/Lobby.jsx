import React, {useCallback, useState ,useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useSocket} from '../context/SocketProvider';

const LobbyScreen = ()=>{

const [email,setEmail] = useState('');
const [room ,setRoom] = useState('');

const socket=useSocket();
const navigate= useNavigate();

const handleSubmitForm= useCallback(
    (e) => {
        e.preventDefault();

        socket.emit("room:join" , {email,room});
    },
    [email,room, socket]
);

const handleJoinRoom = useCallback(
    (data) => {
    const {email,room} = data;
    navigate('/room/${room}');
},
[navigate]
);

useEffect (() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
        socket.off("room:join", handleJoinRoom);
    };
},[socket,handleJoinRoom]);

    return(
        <>
            <div>
                <h1>Lobby</h1>
                <form onSubmit={handleSubmitForm}>
                    <label htmlFor='email'>Emali id</label>
                    <input type='email' id='email' value={email} onChange={e=> setEmail(e.target.value)}/>
                    <label htmlFor='room'>Room Number</label>
                    <input type='number' id='room' value={room} onChange={e=> setRoom(e.target.value)}/>
                    <button>Join Now</button>
                </form>
            </div>
        </>
    );
};

export default LobbyScreen;