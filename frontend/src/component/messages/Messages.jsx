import React, { useEffect, useRef, useState } from 'react'
import Message from './Message'
import MessageSkeleton from '../../skeleton/MessageSkeleton'
import useConversation from '../../zustand/useConversation'
import toast, { Toaster } from 'react-hot-toast'

const Messages = () => {
  const [loading,setLoading] = useState(false)
  const { messages, setMessages, selectedConversation } = useConversation()
  const lastMessageRef = useRef()
  useEffect(()=>{
    const getMessage = async()=>{
      setLoading(true)
      try {
        const res = await fetch(`/messages/${selectedConversation._id}`)
        const data = await res.json()
        if(data.error)
          throw new Error(data.error)
        setMessages(data)
        console.log(data)
      } catch (error) {
        toast.error(error.message)
      }finally{
        setLoading(false)

      }
    }    
    getMessage()
  },[selectedConversation?._id, setMessages])

  useEffect(()=>{
    setTimeout(()=>{
      lastMessageRef.current?.scrollIntoView({behavior:"smooth"})
    },100)
  },[messages])
  return (
    <div className='px-4 flex-1 overflow-auto'>
      <Toaster/>

      {!loading && messages.length>0 && messages.map(message=>(
        <div  key={message._id} ref={lastMessageRef}>
          <Message message={message}/>

        </div>
))}
       {loading&&[...Array(3)].map((_,index)=><MessageSkeleton key={index}/>)}
        {!loading && messages.length===0 &&(
          <p className='text-center'>Send a message to start the conversation</p>
        )}
    </div>
  )
}

export default Messages
