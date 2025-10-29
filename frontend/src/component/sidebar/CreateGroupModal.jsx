import React, { useState, useEffect } from 'react';
import useGetUsersForGroup from '../../hooks/useGetUsersForGroup'; // Hook lấy danh sách user (sẽ tạo)
import useCreateGroup from '../../hooks/useCreateGroup'; // Hook tạo nhóm (sẽ tạo)
import toast from 'react-hot-toast';

const CreateGroupModal = ({ onClose }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]); // Lưu ID của user được chọn
    const [searchTerm, setSearchTerm] = useState(''); // Để tìm kiếm user

    const { loading: loadingUsers, users } = useGetUsersForGroup(); // Lấy danh sách user
    const { loading: loadingCreate, createGroup } = useCreateGroup(); // Lấy hàm tạo nhóm

    // Lọc user dựa trên searchTerm (chỉ tìm bạn bè)
    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserSelect = (userId) => {
        setSelectedUsers(prevSelected =>
            prevSelected.includes(userId)
                ? prevSelected.filter(id => id !== userId) // Bỏ chọn nếu đã chọn
                : [...prevSelected, userId] // Thêm vào danh sách nếu chưa chọn
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) {
            toast.error('Vui lòng nhập tên nhóm');
            return;
        }
        if (selectedUsers.length < 2) {
            toast.error('Vui lòng chọn ít nhất 2 người bạn');
            return;
        }

        await createGroup({ groupName: groupName.trim(), participants: selectedUsers });

        // Nếu tạo thành công (hook useCreateGroup sẽ xử lý cập nhật state), đóng modal
        if (!loadingCreate) { // Kiểm tra lại logic này trong hook, có thể cần state báo thành công
             onClose(); // Đóng modal sau khi tạo xong
        }
    };

    return (
        // Sử dụng daisyUI modal
        <dialog id="create_group_modal" className="modal modal-open"> {/* Thêm modal-open */}
            <div className="modal-box rounded-lg">
                <h3 className="font-bold text-lg mb-4">Tạo Nhóm Mới</h3>

                <form onSubmit={handleSubmit}>
                    {/* Input Tên Nhóm */}
                    <div className="mb-4">
                        <label className="input input-bordered flex items-center gap-2">
                            Tên nhóm:
                            <input
                                type="text"
                                className="grow"
                                placeholder="Nhập tên nhóm..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                required
                            />
                        </label>
                    </div>

                    {/* Input Tìm kiếm Bạn bè */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Tìm kiếm bạn bè..."
                            className="input input-bordered w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Danh sách User để chọn */}
                    <h4 className="font-semibold mb-2">Chọn thành viên (ít nhất 2):</h4>
                    <div className="max-h-60 overflow-y-auto mb-4 border rounded-md p-2 bg-base-200">
                        {loadingUsers ? (
                            <span className="loading loading-spinner"></span>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <div
                                    key={user._id}
                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-sky-500 mb-1 ${selectedUsers.includes(user._id) ? 'bg-sky-600' : ''}`}
                                    onClick={() => handleUserSelect(user._id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="avatar">
                                            <div className="w-8 rounded-full">
                                                <img src={user.profilePic} alt="avatar" />
                                            </div>
                                        </div>
                                        <span>{user.fullName} (@{user.username})</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user._id)}
                                        readOnly
                                        className="checkbox checkbox-info"
                                    />
                                </div>
                            ))
                        ) : (
                            <p>Không tìm thấy người dùng nào.</p>
                        )}
                    </div>

                    {/* Nút Tạo và Đóng */}
                    <div className="modal-action mt-6">
                        <button type="button" className="btn" onClick={onClose}>Hủy</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loadingCreate || selectedUsers.length < 2 || !groupName.trim()}
                        >
                            {loadingCreate ? <span className="loading loading-spinner"></span> : 'Tạo Nhóm'}
                        </button>
                    </div>
                </form>

                {/* Nút đóng mặc định của daisyUI (tùy chọn) */}
                 {/* <form method="dialog">
                     <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                 </form> */}
            </div>
             {/* Click bên ngoài để đóng */}
            <form method="dialog" className="modal-backdrop">
                 <button type="button" onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};

export default CreateGroupModal;