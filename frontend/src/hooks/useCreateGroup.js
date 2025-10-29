import { useState } from 'react';
import toast from 'react-hot-toast';
import useConversation from '../zustand/useConversation';

const useCreateGroup = () => {
    const [loading, setLoading] = useState(false);
    const { conversations, setConversations, setSelectedConversation } = useConversation();

    const createGroup = async ({ groupName, participants }) => {
        // Kiểm tra input cơ bản (dù đã check ở modal)
        if (!groupName || !participants || participants.length < 2) {
            toast.error('Tên nhóm và ít nhất 2 thành viên là bắt buộc');
            return false;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/groups/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupName, participants }),
            });

            const data = await res.json();
            if (data.error) {
                throw new Error(data.error);
            }

            // Tạo nhóm thành công
            toast.success(`Đã tạo nhóm "${groupName}"!`);

            // Cập nhật danh sách conversations trong Zustand
            // Định dạng lại data trả về từ API cho giống cấu trúc trong Zustand
             const newGroupConversation = {
                 _id: data._id, // ID của group conversation
                 isGroup: true,
                 groupName: data.groupName,
                 groupAdmin: data.groupAdmin,
                 profilePic: data.groupAdmin?.profilePic || '', // Hoặc ảnh mặc định cho group
                 participants: data.participants, // Danh sách thành viên đầy đủ
                 lastMessage: null, // Nhóm mới chưa có tin nhắn
                 updatedAt: data.updatedAt
             };

            setConversations([newGroupConversation, ...conversations]);
            // Tùy chọn: Chọn luôn nhóm vừa tạo
            // setSelectedConversation(newGroupConversation);

            return true; // Trả về true nếu thành công

        } catch (error) {
            toast.error(error.message);
            console.error("Lỗi khi tạo nhóm:", error.message)
            return false; // Trả về false nếu thất bại
        } finally {
            setLoading(false);
        }
    };

    return { loading, createGroup };
};

export default useCreateGroup;