import React, { useState } from 'react';
import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import useConversation from '../../zustand/useConversation';

const CreateGroupModal = ({ onClose }) => {
const [users, setUsers] = useState([]);
const [selectedUsers, setSelectedUsers] = useState([]);
const [groupName, setGroupName] = useState("");
const { conversations, setConversations } = useConversation();

useEffect(() => {
  fetch("/users")
    .then(res => res.json())
    .then(data => setUsers(data));
}, []);

const toggleSelectUser = (id) => {
  setSelectedUsers(prev =>
    prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
  );
};

const handleCreateGroup = async () => {
  try {
    const res = await fetch("/groups/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      groupName: groupName,
      participants: selectedUsers
    })
  });
  const data = await res.json();
  if(data?.error){
    toast.error(data.error)
  }else{
    // setConversations(...conversations,data)
    toast.success("Group created")
    console.log("Group created:", data);

  }
 
  } catch (error) {
    toast.error(error.message)
  }
};

console.log("user ",users)
  return (
    <div className="p-4">
        <input
            className="border p-2 w-full mb-3 rounded"
            placeholder="Tên nhóm..."
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
        />

        <div className="max-h-60 overflow-y-auto border p-2 rounded mb-3">
            {users.map(u => (
            <label key={u._id} className="flex items-center gap-2 py-1">
                <input
                type="checkbox"
                checked={selectedUsers.includes(u._id)}
                onChange={() => toggleSelectUser(u._id)}
                />
                <img src={u.profilePic} alt="" className="w-6 h-6 rounded-full" />
                <span className='text-white'>{u.username}</span>
            </label>
            ))}
        </div>

        <button
            onClick={handleCreateGroup}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
            Tạo nhóm
  </button>
</div>

  );
};

export default CreateGroupModal;
