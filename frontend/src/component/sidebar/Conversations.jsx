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
        if (data.error) throw new Error(data.error);
        console.log("conversations ",data)
        setConversations(data.filter(conv => conv._id !== null));

      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    console.log("inner effect ")
    getConversations();
  }, [setConversations]);
  console.log("updated lại conversation ",conversations)
  return (
    <div className='py-2 flex flex-col overflow-auto'>
      {loading && <span className='loading loading-spinner mx-auto'></span>}
      {Array.isArray(conversations) && conversations?.map((conversation, index) => (
        <Conversation
          key={conversation._id || `temp-${index}`}
          conversation={conversation}
          emoji={getRandomEmoji()}
          lastIdx={index === conversations.length - 1}
        />
      ))}
    </div>
  );
};

export default Conversations;
