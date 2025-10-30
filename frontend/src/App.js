import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './page/home/Home';
import Login from './page/login/Login';
import SignUp from './page/signUp/SignUp';
import { useContext, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import { SocketContext } from './context/SocketContextProvider';
import useConversation from './zustand/useConversation';
import notificationSound from './sounds/frontend_src_assets_sounds_notification.mp3';

function App() {
  const { authUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { messages, setMessages, selectedConversation } = useConversation();
  const sound = new Audio(notificationSound);

  useEffect(() => {
    if (!socket) return;

    // nhận tin nhắn 1-1
    socket.on('newMessage', (newMessage) => {
      console.log("new message ", newMessage);
      if(newMessage.conversationId === selectedConversation?._id){
        useConversation.setState((state) => ({
        messages: [...state.messages, newMessage],
      }));
      }
      sound.play().catch(() => {
        console.warn("⚠️ Browser chặn âm thanh tự động, cần tương tác người dùng trước khi play()");
      });
    });

  console.log("list message ", messages)


    // nhận tin nhắn nhóm
    
    socket.on('newGroupMessage', (newMessage) => {
      console.log("new group message ", newMessage);
      console.log("isvalid ",newMessage.conversationId === selectedConversation?._id)
      if(newMessage.conversationId === selectedConversation?._id){
        useConversation.setState((state) => ({
        messages: [...state.messages, newMessage],
      }));
    }
      sound.play();
    });

    return () => {
      socket.off('newMessage');
      socket.off('newGroupMessage');
    };
  }, [socket, setMessages]);

  return (
    <div className='p-4 h-screen flex items-center justify-center'>
      <Routes>
        <Route path='/' element={authUser ? <Home /> : <Navigate to='/login' />} />
        <Route path='/login' element={authUser ? <Navigate to='/' /> : <Login />} />
        <Route path='/signup' element={authUser ? <Navigate to='/' /> : <SignUp />} />
      </Routes>
    </div>
  );
}

export default App;
