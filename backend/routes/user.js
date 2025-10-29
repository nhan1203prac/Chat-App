import express from 'express';
import protectRoute  from '../middleware/verify.js';
import User from '../models/userModel.js';
import Conversation from '../models/conversation.js'; // Import Conversation model
import mongoose from 'mongoose'; // Import mongoose

const router = express.Router();

// --- CẬP NHẬT ROUTE NÀY ---
// @desc Lấy danh sách người dùng/cuộc trò chuyện cho sidebar
// @route GET /api/users
// @access Private
router.get('/', protectRoute, async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        // 1. Lấy tất cả các cuộc trò chuyện (1-1 và nhóm) mà người dùng tham gia
        const conversations = await Conversation.find({ participants: loggedInUserId })
            .sort({ updatedAt: -1 }) // Sắp xếp theo cập nhật mới nhất
            .populate({
                path: 'participants',
                select: '-password', // Loại bỏ password của participants
            })
            .populate('groupAdmin', '-password') // Populate admin nếu là group
            .populate({
                 path: 'messages', // Populate messages để lấy tin nhắn cuối
                 options: { sort: { createdAt: -1 }, limit: 1 } // Chỉ lấy tin mới nhất
             });


        // 2. Định dạng lại dữ liệu trả về cho frontend
        const formattedConversations = conversations.map(conv => {
            let displayData = {};
            const lastMessage = conv.messages.length > 0 ? conv.messages[0] : null;

            if (conv.isGroupChat) {
                // Nếu là nhóm chat
                displayData = {
                    _id: conv._id, // ID của cuộc trò chuyện nhóm
                    isGroup: true,
                    groupName: conv.groupName,
                    groupAdmin: conv.groupAdmin, // Thông tin admin đã populate
                     // Lấy avatar của admin hoặc một avatar mặc định cho nhóm
                    profilePic: conv.groupAdmin?.profilePic || '', // Hoặc ảnh mặc định cho group
                    participants: conv.participants, // Danh sách thành viên đầy đủ
                    lastMessage: lastMessage ? {
                        _id: lastMessage._id,
                        senderId: lastMessage.senderId,
                        message: lastMessage.message,
                        createdAt: lastMessage.createdAt
                     } : null,
                     updatedAt: conv.updatedAt // Thời gian cập nhật cuộc trò chuyện
                };
            } else {
                // Nếu là chat 1-1, tìm người còn lại
                const otherParticipant = conv.participants.find(
                    p => p._id.toString() !== loggedInUserId.toString()
                );

                 // Nếu không tìm thấy người còn lại (trường hợp lạ), bỏ qua
                 if (!otherParticipant) return null;


                displayData = {
                    _id: otherParticipant._id, // Sử dụng ID của người kia làm key (giống code cũ của bạn)
                    isGroup: false,
                    fullName: otherParticipant.fullName,
                    username: otherParticipant.username,
                    profilePic: otherParticipant.profilePic,
                     // Có thể cần ID của cuộc trò chuyện 1-1 để gửi tin nhắn
                    conversationId: conv._id,
                    lastMessage: lastMessage ? {
                         _id: lastMessage._id,
                         senderId: lastMessage.senderId,
                         message: lastMessage.message,
                         createdAt: lastMessage.createdAt
                    } : null,
                    updatedAt: conv.updatedAt // Thời gian cập nhật cuộc trò chuyện
                };
            }
            return displayData;
        }).filter(item => item !== null); // Lọc bỏ các kết quả null (nếu có lỗi)

        res.status(200).json(formattedConversations);

    } catch (error) {
        console.error('Lỗi khi lấy danh sách users/conversations:', error.message);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

export default router;