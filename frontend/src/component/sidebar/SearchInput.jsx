import React, { useState } from 'react';
import { IoSearchSharp } from "react-icons/io5";
import useConversation from '../../zustand/useConversation';
import toast, { Toaster } from 'react-hot-toast';


const SearchInput = () => {
  const [search,setSearch] = useState('')
  const {conversations,setSelectedConversation} = useConversation()

  const handleSubmit = (e)=>{
    e.preventDefault()
    if(!search)
      return;
    const conversation = conversations.find(c=>c.fullname.toLowerCase().includes(search.toLowerCase()))
    if(conversation){
      setSelectedConversation(conversation)
      setSearch("")

    }else toast.error("No such use found!");
  }
  return (
    <form onSubmit={handleSubmit} className='flex items-center gap-2'>
        <Toaster/>
        <input type="text" placeholder='Search' className='input input-bordered  rounded-full' onChange={e=>setSearch(e.target.value)} />
        <button type='submit' className='btn btn-circle bg-sky-500 text-white'>
        <IoSearchSharp className='w-6 h-6 outline-none' />
        </button>
    </form>
  )
} 

export default SearchInput
