
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './page/home/Home';
import Login from './page/login/Login';
import SignUp from './page/signUp/SignUp';
import { useContext, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import { SocketContext } from './context/SocketContextProvider';
import useConversation from './zustand/useConversation';
import notificationSound from './sounds/frontend_src_assets_sounds_notification.mp3'
function App() {
  const {authUser} = useContext(AuthContext)
  const {socket} = useContext(SocketContext)
  const {messages,setMessages} = useConversation()
  const sound = new Audio(notificationSound)

  useEffect(()=>{
    socket?.on("newMessage",(newMessage)=>{
      setMessages([...messages,newMessage])
      sound.play()
    })
    
    return ()=>socket?.off("newMessage")
  },[socket,messages,setMessages])

  return (
    <div className='p-4 h-screen flex items-center justify-center'>
      <Routes>
        <Route path='/' element={authUser?<Home/>:<Navigate to="/login"/>}/>
        <Route path='login' element={authUser? <Navigate to="/"/>:<Login/>}/>
        <Route path='/signup' element={authUser?<Navigate to="/"/>:<SignUp/>}/>
        
      </Routes>
    </div>
  );
}

export default App;
