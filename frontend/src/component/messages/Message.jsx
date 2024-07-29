import React, { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import useConversation from '../../zustand/useConversation'
import { extracTime } from '../../untils/extractime'

const Message = ({message}) => {
  const {authUser} = useContext(AuthContext)
  const {selectedConversation} = useConversation()
  const fromMe = authUser._id === message.senderId
  const chatClassName = fromMe?"chat-end":"chat-start" 
  const profilePic = fromMe?authUser.profilePic:selectedConversation.profilePic
  const bubbleBgColor = fromMe?'bg-blue-500':""
  const formatTime = extracTime(message.createdAt)
  return (
    <div className={`chat ${chatClassName}`}>
        <div className='chat-image avatar'>
            <div className='w-10 rounded-full'>
                <img src={profilePic} 
                    alt="user avatar" />
            </div>
        </div>
        <div className={`chat-bubble text-white  ${bubbleBgColor}`}>{message.message}</div>
        <div className='chat-footer opacity-50 text-xs flex gap-1 items-center text-gray-500'>{formatTime}</div>
    </div>
  )
}

export default Message
