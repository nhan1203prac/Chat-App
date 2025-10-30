import React, { useContext, useEffect } from 'react';
import Messages from './Messages';
import MessageInput from './MessageInput';
import { TiMessages } from 'react-icons/ti';
import useConversation from '../../zustand/useConversation';
import { AuthContext } from '../../context/AuthContext';

const MessageContainer = () => {
  const { selectedConversation, setSelectedConversation } = useConversation();

  useEffect(() => {
    return () => setSelectedConversation(null);
  }, [setSelectedConversation]);

  return (
    <div className='flex-1 flex flex-col bg-gray-900 text-white'>
      {!selectedConversation ? (
        <NoChatSelected />
      ) : (
        <>
          <div className='bg-gray-800 px-4 py-3 mb-2 font-bold text-lg'>
            {selectedConversation.isGroupChat
              ? `Nhóm: ${selectedConversation.groupName}`
              : `To: ${selectedConversation.username}`}
          </div>
          <Messages />
          <MessageInput />
        </>
      )}
    </div>
  );
};

export default MessageContainer;

const NoChatSelected = () => {
  const { authUser } = useContext(AuthContext);
  return (
    <div className='flex items-center justify-center w-full h-full'>
      <div className='px-4 text-center text-gray-300 font-semibold flex flex-col items-center gap-2'>
        <p>Chào 👋 {authUser.fullname} ❄</p>
        <p>Chọn một đoạn chat để bắt đầu</p>
        <TiMessages className='text-4xl text-center' />
      </div>
    </div>
  );
};
