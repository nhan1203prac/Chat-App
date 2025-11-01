import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './page/home/Home';
import Login from './page/login/Login';
import SignUp from './page/signUp/SignUp';
import { useContext, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import { SocketContext } from './context/SocketContextProvider';
import useConversation from './zustand/useConversation';
import notificationSound from './sounds/frontend_src_assets_sounds_notification.mp3';
import toast from 'react-hot-toast';

function App() {
  const { authUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const sound = new Audio(notificationSound);

  useEffect(() => {
    if (!socket) return;

    socket.on('newMessage', (newMessage) => {
      const { selectedConversation, conversations, messages } = useConversation.getState();

      console.log("new message ", newMessage.conversation);
      console.log("current selectedConversation ", selectedConversation);
      console.log("all conversations ", conversations);

      const isCurrentChat = newMessage.message.conversationId === selectedConversation?._id;

      if (isCurrentChat) {
        useConversation.setState({
          messages: [...messages, newMessage.message],
        });
      }

      const isExist = conversations.find(c => c._id === newMessage.message.conversationId);
      if (!isExist) {
        useConversation.setState({
          conversations: [...conversations.filter(item=>item._id !== null), newMessage.conversation],
        });
      }

      sound.play().catch(() => {
        console.warn("Browser chặn âm thanh tự động, cần tương tác người dùng trước khi play()");
      });
    });

    //  Khi group mới được tạo
    socket.on('groupCreated', (newGroup) => {
      const { conversations } = useConversation.getState();
      useConversation.setState({
        conversations: [...conversations, newGroup],
      });
    });

    //  Khi có tin nhắn nhóm
    socket.on('newGroupMessage', (newMessage) => {
      
      const { selectedConversation, messages } = useConversation.getState();
      const isCurrentGroup = newMessage.conversationId === selectedConversation?._id;

      if (isCurrentGroup) {
        useConversation.setState({
          messages: [...messages, newMessage],
        });
      }

      sound.play().catch(() => {});
    });

    socket.on("groupNamed", ({ chatId, newName, updatedBy }) => {
      const { selectedConversation, conversations } = useConversation.getState();
      console.log("groupNamed ", newName);

      // Chỉ cập nhật nếu selectedConversation là chat đó
      if (selectedConversation?._id === chatId) {
        // Cập nhật selectedConversation và conversations cùng lúc
        useConversation.setState({
          selectedConversation: {
            ...selectedConversation,
            groupName: newName
          },
          conversations: conversations.map(conv =>
            conv._id === chatId ? { ...conv, groupName: newName } : conv
          )
        });

        // Nếu người đổi tên không phải là chính bạn thì hiện toast
        const isNotCurrentUser = updatedBy._id !== authUser._id;
        if (isNotCurrentUser) {
          toast.success(`${updatedBy.username} đã đổi tên nhóm thành ${newName}`);
        }
      }
    });
    socket.on("memberLeftGroup", ({ chatId, user }) => {
  const { selectedConversation, conversations } = useConversation.getState();

  // Nếu bạn đang mở đúng group đó
  if (selectedConversation?._id === chatId) {
    toast(`${user.username} đã rời nhóm`);
  }

  // Nếu chính bạn bị xoá khỏi nhóm → loại group khỏi danh sách
  if (user._id === authUser._id) {
    useConversation.setState({
      conversations: conversations.filter(conv => conv._id !== chatId),
      selectedConversation:
        selectedConversation?._id === chatId ? null : selectedConversation
    });
  }
});


// Khi nhóm bị xóa hoàn toàn
socket.on("groupDeleted", ({ chatId }) => {
  const { selectedConversation, conversations } = useConversation.getState();

  useConversation.setState({
    conversations: conversations.filter(conv => conv._id !== chatId),
    selectedConversation:
      selectedConversation?._id === chatId ? null : selectedConversation
  });

  toast("Nhóm đã bị hủy bởi admin");
});

socket.on("memberAdded", ({ conversation, userAdded,updatedBy }) => {
  const { selectedConversation,conversations,setConversations } = useConversation.getState();
  console.log("socket memberAdded selected ",selectedConversation)
  console.log("socket memberAdded chatId",conversation)
  console.log("socket memberAdded userAdded",userAdded)
  console.log("socket memberAdded authuser",authUser)


  if(userAdded._id === authUser._id){
    console.log("here")
    // useConversation.setState({
    //   conversations: [...conversations, conversation]
    // });
     useConversation.setState({
          conversations: [...conversations?.filter(item=>item._id !== null), conversation]
        });
    console.log("log ",conversations)

  }
  
  if (selectedConversation?._id === conversation._id && selectedConversation?.groupAdmin._id !== authUser._id) {
    useConversation.setState({
      selectedConversation: {
        ...selectedConversation,
        participants: [...selectedConversation.participants, userAdded],
      },
    });

    toast.success(`${userAdded.username} đã được ${updatedBy.username} thêm vào nhóm`);
  }
  if (!selectedConversation && userAdded._id !== authUser._id) {
    useConversation.setState({
      conversations: conversations.map(item =>
        item._id === conversation._id ? conversation : item
      ),
    });
  }

});



    //  Cleanup
    return () => {
      socket.off('newMessage');
      socket.off('newGroupMessage');
      socket.off('groupCreated');
      socket.off('groupNamed')
      socket.off('memberAdded')
      
    };
  }, [socket]);

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
