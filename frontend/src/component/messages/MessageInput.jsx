import React, { useState } from 'react'
import { BsSend } from "react-icons/bs";
import useConversation from '../../zustand/useConversation';
import toast from 'react-hot-toast';
const MessageInput = () => {
  const [loading,setLoading] = useState(false)
  const [message,setMessage] = useState("")
  const {selectedConversation,messages,setMessages} = useConversation()
  const handleSendMessage = async(e)=>{
    e.preventDefault()
    if(!message) return;
    setLoading(true)
    // console.log(selectedConversation._id)
    try {
      const res = await fetch(`/messages/send/${selectedConversation._id}`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message})
      })
      const data = await res.json()
      if(data.error)
        throw new Error(data.error)
      setMessages([...messages,data])
      setMessage("")
      console.log(data)
    } catch (error) {
      toast.error(error.message)
    }finally{
      setLoading(false)
    }
  }
  return (
    <form className='px-4 my-3' onSubmit={handleSendMessage}>
        <div className='w-full relative'>
            <input type="text" placeholder='Send a message'
            onChange={e=>setMessage(e.target.value)}
            value={message}
            className='border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 text-white' />
            <button type='submit' className='absolute inset-y-0 end-0 flex items-center pe-3'>
               {loading?<span className='loading loading-spinner'></span>:<BsSend className='text-2xl text-white'/>} 
            </button>

        </div>
    </form>
  )
}

export default MessageInput
