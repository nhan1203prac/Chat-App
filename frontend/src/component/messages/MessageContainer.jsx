import React, { useContext, useEffect, useState } from 'react';
import Messages from './Messages';
import MessageInput from './MessageInput';
import { TiMessages } from 'react-icons/ti';
import useConversation from '../../zustand/useConversation';
import { AuthContext } from '../../context/AuthContext';
import { MdMoreVert } from 'react-icons/md';
import toast from 'react-hot-toast';

const MessageContainer = () => {
  const { selectedConversation, setSelectedConversation,setConversations,conversations } = useConversation();
  const { authUser } = useContext(AuthContext);
  const [showRename, setShowRename] = useState(false)
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false)
  const [availableUser,setAvailableUser] = useState()
  useEffect(() => {
    return () => setSelectedConversation(null);
  }, [setSelectedConversation]);

  useEffect(() => {
  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch('/users');
      const allUsers = await res.json();
      const { selectedConversation } = useConversation.getState();

      if (!selectedConversation?.participants || selectedConversation.participants.length === 0) {
        setAvailableUser(allUsers);
        return;
      }

      const memberIds = selectedConversation.participants.map(p => p._id);

      const filtered = allUsers.filter(user => !memberIds.includes(user._id));

      setAvailableUser(filtered);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  fetchAvailableUsers();
}, [selectedConversation]);



  if (!selectedConversation) return <NoChatSelected />;

  const isAdmin =
    selectedConversation.isGroupChat &&
    selectedConversation.groupAdmin?._id === authUser._id;

  const handleRename = async () => {
    if (!newGroupName.trim()) return toast.error("Tên nhóm không được để trống");

    try {
      const res = await fetch(`/groups/rename`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          chatId: selectedConversation._id,
          groupName: newGroupName.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        return toast.error(data.error || "Đổi tên nhóm thất bại");
      }

      // Cập nhật selectedConversation
      setSelectedConversation({
        ...selectedConversation,
        groupName: data.groupName
      });

      // Cập nhật conversations
      setConversations(conversations.map(conv=>conv._id === selectedConversation._id ?
        { ...conv, groupName: data.groupName }:conv))
      // setConversations(prev =>
      //   prev.map(conv =>
      //     conv._id === selectedConversation._id
      //       ? { ...conv, groupName: data.groupName }
      //       : conv
      //   )
      // );

      toast.success("Đổi tên nhóm thành công!");
      setShowRename(false);
      setNewGroupName("");

    } catch (error) {
      toast.error(error.message || "Đổi tên nhóm thất bại");
    }
  };
  const handleAddMember = async(userId)=>{
    try {
      console.log("userId ",userId)
      console.log("chatId ", selectedConversation._id)

      const res = await fetch('/groups/add-member',{
        method:'PUT',
        headers:{"Content-Type":"application/json"},
        credentials:'include',
        body:JSON.stringify({
          chatId:selectedConversation._id,
          userIdToAdd:userId
        })
      })
      const data = await res.json()
      if(!res.ok) return toast.error(data.error || 'Thêm thành viên thất bại')
        setSelectedConversation(data)
        setConversations(conversations.map(c => c._id === data._id ? data : c));
        setAvailableUser(availableUser.filter(u => u._id !== userId));

        toast.success("Thêm thành viên thành công")
    } catch (error) {
      console.log("error handle add member ",error.message)
      toast.error(error.message)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 text-white">
      <div
        className={`bg-gray-800 px-4 py-3 mb-2 font-bold text-lg ${
          selectedConversation.isGroupChat
            ? 'flex items-center justify-between'
            : ''
        }`}
      >
        {selectedConversation.isGroupChat
          ? `Nhóm: ${selectedConversation.groupName}`
          : `To: ${selectedConversation.otherUser.username}`}

        {selectedConversation.isGroupChat && (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="text-2xl cursor-pointer hover:text-gray-400"
            >
              <MdMoreVert />
            </div>

            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow bg-black text-blue-400"
            >
              {isAdmin ? (
                <>
                  <li>
                    <a onClick={()=>setShowRename(true)}>Đổi tên nhóm</a>
                  </li>
                  <li>
                    <a onClick={()=>setShowAddMember(true)}>Thêm thành viên</a>
                  </li>
                  <li>
                    <a className='text-red-400'>Xóa nhóm</a>
                  </li>
                  <li>
                    <a className='text-red-400'>Kick thành viên</a>
                  </li>
                  
                </>
              ) : (
                <>
                  {/* <li>
                    <a>Thêm thành viên</a>
                  </li> */}
                  <li>
                    <a className="text-red-500">Rời nhóm</a>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>

      <Messages />
      <MessageInput />

      {showRename && (
        <div className="absolute top-20 right-10 w-80 bg-gray-800 p-4 rounded shadow-lg z-50">
          <h3 className="text-white font-bold mb-2">Đổi tên nhóm</h3>
          <input
            type="text"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder="Nhập tên nhóm mới"
            className="w-full p-2 rounded bg-gray-700 text-white mb-2"
          />
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500"
              onClick={() => setShowRename(false)}
            >
              Hủy
            </button>
            <button
              className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-400"
              onClick={handleRename}
            >
              Lưu
            </button>
          </div>
        </div>
      )}
      {showAddMember && (
      <div className="absolute top-20 right-10 w-96 bg-gray-800 p-4 rounded shadow-lg z-50">
        <h3 className="text-white font-bold mb-2">Thêm thành viên</h3>
        <div className="max-h-60 overflow-y-auto">
          {availableUser?.length > 0 ? (
            availableUser.map(u => (
              <div
                key={u._id}
                className="flex items-center justify-between py-2 border-b border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.profilePic || "/default-avatar.png"} 
                    alt={u.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-white">{u.username}</span>
                </div>
                <button
                  className="text-blue-400 hover:text-blue-300"
                  onClick={() => handleAddMember(u._id)}
                >
                  + Thêm
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400">Không còn ai để thêm</p>
          )}
        </div>
        <button
          className="mt-3 px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 w-full"
          onClick={() => setShowAddMember(false)}
        >
          Đóng
        </button>
      </div>
    )}


    </div>
  );
};

export default MessageContainer;

const NoChatSelected = () => {
  const { authUser } = useContext(AuthContext);
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="px-4 text-center text-gray-300 font-semibold flex flex-col items-center gap-2">
        <p>Chào 👋 {authUser.fullname} ❄</p>
        <p>Chọn một đoạn chat để bắt đầu</p>
        <TiMessages className="text-4xl text-center" />
      </div>
    </div>
  );
};
