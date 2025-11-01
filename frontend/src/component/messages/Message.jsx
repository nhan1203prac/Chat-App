import React, { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import useConversation from '../../zustand/useConversation'
import { extracTime } from '../../untils/extractime'

const Message = ({ message }) => {
  const { authUser } = useContext(AuthContext)
  const { selectedConversation } = useConversation()




  const fromMe = authUser._id === message.senderId._id

  let profilePic = authUser.profilePic
  if (!fromMe) {
    if (selectedConversation.isGroupChat) {
      profilePic = message.senderId.profilePic
    } else {
      profilePic = selectedConversation.otherUser.profilePic 
    }
  }

  const chatClassName = fromMe ? "chat-end" : "chat-start"
  const bubbleBgColor = fromMe ? 'bg-blue-500' : 'bg-gray-700'

  const formatTime = extracTime(message.createdAt)
  console.log("message ", message.senderId.fullname)
  return (
    <div className={`chat ${chatClassName}`}>
      <div className='chat-image avatar'>
        <div className='w-10 rounded-full'>
          <img src={profilePic} alt="user avatar" />
        </div>
      </div>
      <div className={`chat-bubble text-white ${bubbleBgColor}`}>
        {message.message}
      </div>
      <div className='chat-footer opacity-50 text-xs flex gap-1 items-center text-gray-500'>
          {selectedConversation.isGroupChat && !fromMe && (
            <span className='font-semibold text-[11px] text-gray-300'>
              {message.senderId.fullname}
            </span>
          )}
        <span className='ml-2'>{formatTime}</span>
      </div>
    </div>
  )
}

export default Message
