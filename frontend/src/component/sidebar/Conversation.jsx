import React, { useContext } from 'react'
import useConversation from '../../zustand/useConversation'
import { SocketContext } from '../../context/SocketContextProvider';

const Conversation = ({conversation,emoji,lastIdx}) => {
  const {selectedConversation,setSelectedConversation} = useConversation()
  const isSelected = selectedConversation?._id === conversation._id;
  const {socket, onlineUsers} = useContext(SocketContext)
  const isOnline = onlineUsers.includes(conversation._id)

  const handleSelect = () => {
    setSelectedConversation(conversation);
    if (conversation.isGroup) {
      socket.emit("joinGroup", conversation._id);
    }
  }

  return (
    <>
      <div
        className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer ${isSelected && "bg-sky-500"}`}
        onClick={handleSelect}
      >
        <div className={`avatar ${isOnline ? "online" : ""}`}>
          <div className='w-12 rounded-full'>
            <img src={conversation.profilePic} alt="user avatar" />
          </div>
        </div>
        <div className='flex flex-col flex-1'>
          <div className='flex gap-3 justify-between'>
            <p className='font-bold text-gray-200'>
              {conversation.isGroup ? conversation.groupName : conversation.username}
            </p>
            <span className='text-x1'>{emoji}</span>
          </div>
        </div>
      </div>
      {!lastIdx && <div className='divider my-0 py-0 h-1'></div>}
    </>
  )
}

export default Conversation;
