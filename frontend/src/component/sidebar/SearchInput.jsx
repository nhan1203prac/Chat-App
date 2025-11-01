import React, { useState } from 'react';
import { IoSearchSharp } from "react-icons/io5";
import useConversation from '../../zustand/useConversation';
import toast, { Toaster } from 'react-hot-toast';

const SearchInput = () => {
  const [search, setSearch] = useState('');
  const { setConversations } = useConversation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    try {
      const res = await fetch(`/users/search?keyword=${encodeURIComponent(search)}`);
      const data = await res.json();
      console.log("Searc ",data)
      if (data.error) throw new Error(data.error);

      if (data.length > 0) {
        setConversations(data);
      } else {
        toast.error("Không tìm thấy người dùng nào!");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='flex items-center gap-2'>
      <Toaster />
      <input
        type="text"
        placeholder='Search'
        value={search}
        className='input input-bordered rounded-full text-black'
        onChange={e => setSearch(e.target.value)}
      />
      <button type='submit' className='btn btn-circle bg-sky-500 text-white'>
        <IoSearchSharp className='w-6 h-6 outline-none' />
      </button>
    </form>
  );
};

export default SearchInput;
