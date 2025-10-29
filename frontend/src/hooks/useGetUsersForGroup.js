import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const useGetUsersForGroup = () => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const getUsers = async () => {
            setLoading(true);
            try {
                // Sử dụng lại API /api/users, nhưng chỉ lấy thông tin user, không cần conversation
                // API này cần trả về danh sách user khác chính mình
                const res = await fetch('/api/users');
                const data = await res.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                // Lọc bỏ những item là group chat nếu API trả về lẫn lộn
                const filteredUsers = data.filter(item => !item.isGroup);
                setUsers(filteredUsers);

            } catch (error) {
                toast.error(error.message);
                console.error("Lỗi khi lấy danh sách user:", error.message)
            } finally {
                setLoading(false);
            }
        };

        getUsers();
    }, []); // Chạy 1 lần khi component mount

    return { loading, users };
};

export default useGetUsersForGroup;