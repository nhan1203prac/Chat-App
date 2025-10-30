import React, { useEffect, useState } from 'react';
import Conversation from './Conversation';
import toast from 'react-hot-toast';
import { getRandomEmoji } from '../../untils/emojis';
import useConversation from '../../zustand/useConversation';

const Conversations = () => {
  const [loading, setLoading] = useState(false);
  const { conversations, setConversations } = useConversation();

  useEffect(() => {
    const getConversations = async () => {
      setLoading(true);
      try {
        const res = await fetch('/users/conversations');
        const data = await res.json();
        console.log("users ", data)
        if (data.error) throw new Error(data.error);
        setConversations(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    getConversations();
  }, [setConversations]);

  return (
    <div className='py-2 flex flex-col overflow-auto'>
      {loading && <span className='loading loading-spinner mx-auto'></span>}
      {conversations.map((conversation, index) => (
        <Conversation
          key={conversation._id}
          conversation={conversation}
          emoji={getRandomEmoji()}
          lastIdx={index === conversations.length - 1}
        />
      ))}
    </div>
  );
};

export default Conversations;
