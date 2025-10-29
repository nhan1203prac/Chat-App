import React, { useState } from 'react'; // Thêm useState
import SearchInput from './SearchInput';
import Conversations from './Conversations';
import LogoutButton from './LogoutButton';
import { IoMdAddCircleOutline } from "react-icons/io"; // Icon cho nút tạo nhóm
import CreateGroupModal from './CreateGroupModal'; // Component Modal sẽ tạo ở Bước 2

const Sidebar = () => {
    const [isModalOpen, setIsModalOpen] = useState(false); // State để quản lý modal

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <div className='border-r border-slate-500 p-4 flex flex-col'>
            <div className="flex justify-between items-center mb-4"> {/* Container mới cho SearchInput và Nút Add */}
                <SearchInput />
                 {/* Nút tạo nhóm mới */}
                <button
                    className='btn btn-ghost btn-circle text-white'
                    onClick={handleOpenModal} // Mở modal khi click
                    title="Tạo nhóm mới"
                >
                    <IoMdAddCircleOutline className='w-6 h-6 outline-none' />
                </button>
            </div>

            <div className='divider px-3'></div>
            <Conversations />
            <LogoutButton />

            {/* Render Modal nếu isModalOpen là true */}
            {isModalOpen && <CreateGroupModal onClose={handleCloseModal} />}
        </div>
    );
};

export default Sidebar;