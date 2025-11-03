import React, { useContext } from 'react'
import useConversation from '../../zustand/useConversation'
import { SocketContext } from '../../context/SocketContextProvider';
import GroupAvatar from './GroupAvatar ';

const Conversation = ({ conversation, emoji, lastIdx }) => {
  const { selectedConversation, setSelectedConversation } = useConversation()
  const { socket, onlineUsers } = useContext(SocketContext)

  const currentUser = JSON.parse(localStorage.getItem('chat-user')); 
 

    console.log("SelectedConversation ",selectedConversation)
  
  const otherUser = conversation.isGroupChat 
    ? null
    : conversation.participants.find(p => p._id !== currentUser._id)

  // Kiểm tra conversation đang chọn
  const isSelected = selectedConversation?._id === conversation._id

  // Kiểm tra online
  const isOnline = conversation.isGroupChat
    ? onlineUsers.includes(conversation._id)
    : otherUser && onlineUsers.includes(otherUser._id)

  // khi ms search xong ta click vào conversation tìm dc thì tạo cuộc trò chuyện với messages là rỗng
  const handleSelect = async () => {
  let convToSet = conversation;

  if (!conversation._id) {
    // conversation tạm, chưa có _id -> tạo mới
    const otherUserId = conversation.participants.find(p => p._id !== currentUser._id)._id;
    const res = await fetch(`/messages/send/${otherUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }) 
    });
    const data = await res.json();
    convToSet = { ...conversation, _id: data.conversation._id };
  }

  if (!conversation.isGroupChat) {
    convToSet = { ...convToSet, otherUser };
  }

  setSelectedConversation(convToSet);

  if (convToSet.isGroupChat) {
    socket.emit("joinGroup", convToSet._id);
  }
}

  // console.log("otherUser ",otherUser.profilePic)
  return (
    <>
      <div
        className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer ${isSelected && "bg-sky-500"}`}
        onClick={handleSelect}
      >
        <div className={`avatar ${isOnline ? "online" : ""}`}>
          <div className='w-12 rounded-full'>
            {/* <img src={conversation.isGroup ? conversation?.profilePic : otherUser.profilePic} alt="user avatar" /> */}
            {conversation && conversation.isGroupChat?(
              <GroupAvatar participants={conversation?.participants} />
            ):<img src={otherUser?.profilePic} alt="user avatar" className="w-12 rounded-full" />}
          </div>
        </div>
        <div className='flex flex-col flex-1'>
          <div className='flex gap-3 justify-between'>
            <p className='font-bold text-gray-200'>
              {conversation?.isGroupChat ? conversation?.groupName : otherUser?.fullname}
            </p>
            <span className='text-x1'>{emoji}</span>
          </div>
        </div>
      </div>
      {!lastIdx && <div className='divider my-0 py-0 h-1'></div>}
    </>
  )
}

export default Conversation
