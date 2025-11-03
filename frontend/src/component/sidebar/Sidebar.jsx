import React, { useState } from 'react';
import SearchInput from './SearchInput';
import Conversations from './Conversations';
import LogoutButton from './LogoutButton';
import { IoMdAddCircleOutline } from "react-icons/io";
import CreateGroupModal from './CreateGroupModal';

const Sidebar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className='border-r border-slate-500 p-4 flex flex-col relative'>
      <div className="flex justify-between items-center mb-4">
        <SearchInput />

        <button
          className='btn btn-ghost btn-circle text-white hover:text-blue-400 transition'
          onClick={handleOpenModal}
          title="Tạo nhóm mới"
        >
          <IoMdAddCircleOutline className='w-6 h-6 outline-none' />
        </button>
      </div>

      <div className='divider px-3'></div>
      <Conversations />
      <LogoutButton />

      {/* Overlay + Modal */}
      {isModalOpen && (
  <>
    {/* Overlay mờ toàn màn */}
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      onClick={handleCloseModal}
    ></div>

    {/* Modal nằm giữa màn hình */}
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div
        className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md mx-4 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CreateGroupModal onClose={handleCloseModal} />
      </div>
    </div>
  </>
)}


    </div>
  );
};

export default Sidebar;
