const express = require('express');
const  protectRoute = require('../middleware/verify.js');
const Conversation = require('../models/conversation.js');
const User = require('../models/userModel.js');
const mongoose = require('mongoose'); 
const { getReceiverSocketId, io } = require('../socket/socket.js');
const router = express.Router();


router.post('/create', protectRoute, async (req, res) => {
    const { participants, groupName } = req.body;
    const creatorId = req.user._id; 

    if (!groupName || !groupName.trim()) {
        return res.status(400).json({ error: 'Tên nhóm không được để trống.' });
    }
    if (!participants || !Array.isArray(participants) || participants.length < 2) {
        return res.status(400).json({ error: 'Vui lòng chọn ít nhất 2 người bạn để tạo nhóm.' });
    }

    // Đảm bảo người tạo cũng là thành viên và lọc ID trùng lặp
    const finalParticipants = [...new Set([...participants, creatorId.toString()])];

    // Kiểm tra xem tất cả ID thành viên có hợp lệ không
    if (finalParticipants.some(id => !mongoose.Types.ObjectId.isValid(id))) {
         return res.status(400).json({ error: 'Danh sách thành viên chứa ID không hợp lệ.' });
    }
    
 

    try {
        const groupChat = await Conversation.create({
            groupName: groupName.trim(),
            participants: finalParticipants,
            isGroupChat: true,
            groupAdmin: creatorId,
        });

        // Populate thông tin thành viên và admin để trả về
        const fullGroupChat = await Conversation.findById(groupChat._id)
            .populate('participants', '-password') 
            .populate('groupAdmin', '-password'); 
        if (!fullGroupChat) {
             return res.status(404).json({ error: 'Không thể tạo hoặc tìm thấy nhóm vừa tạo.' });
        }
        fullGroupChat.participants.forEach((user)=>{
            const receiveSocketId = getReceiverSocketId(user._id)
            if(receiveSocketId){
                io.to(receiveSocketId).emit('groupCreated', fullGroupChat)
            }
        })

        res.status(201).json(fullGroupChat); 
    } catch (error) {
        console.error('Lỗi khi tạo nhóm:', error.message);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi tạo nhóm.' });
    }
});


// router.put('/rename', protectRoute, async (req, res) => {
//     const { chatId, groupName } = req.body;
//     const userId = req.user._id;

//     if (!chatId || !groupName || !groupName.trim()) {
//         return res.status(400).json({ error: 'Thiếu ID nhóm hoặc tên nhóm mới.' });
//     }
//     if (!mongoose.Types.ObjectId.isValid(chatId)) {
//         return res.status(400).json({ error: 'ID nhóm không hợp lệ.' });
//     }


//     try {
//         const updatedChat = await Conversation.findOneAndUpdate(
//             {
//                 _id: chatId,
//                 isGroupChat: true,
//                 groupAdmin: userId, // Chỉ admin mới được đổi tên
//             },
//             { groupName: groupName.trim() },
//             { new: true } // Trả về document sau khi cập nhật
//         )
//             .populate('participants', '-password')
//             .populate('groupAdmin', '-password');

//         if (!updatedChat) {
//             return res.status(404).json({
//                 error: 'Không tìm thấy nhóm hoặc bạn không có quyền đổi tên nhóm này.',
//             });
//         }


//         res.status(200).json(updatedChat);
//     } catch (error) {
//         console.error('Lỗi khi đổi tên nhóm:', error.message);
//         res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi đổi tên nhóm.' });
//     }
// });


// router.put('/add', protectRoute, async (req, res) => {
//     const { chatId, userIdToAdd } = req.body;
//     const adminId = req.user._id;

//     if (!chatId || !userIdToAdd) {
//         return res.status(400).json({ error: 'Thiếu ID nhóm hoặc ID thành viên cần thêm.' });
//     }
//      if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userIdToAdd)) {
//         return res.status(400).json({ error: 'ID nhóm hoặc ID thành viên không hợp lệ.' });
//     }

//     try {
  
//         const group = await Conversation.findOne({
//             _id: chatId,
//             isGroupChat: true,
//             groupAdmin: adminId
//         });

//         if (!group) {
//              return res.status(403).json({ error: 'Không tìm thấy nhóm hoặc bạn không có quyền thêm thành viên.' });
//         }
        
//         // Kiểm tra xem người dùng đã ở trong nhóm chưa
//         if (group.participants.includes(userIdToAdd)) {
//              return res.status(400).json({ error: 'Người dùng này đã ở trong nhóm.' });
//         }
        
//         // Kiểm tra người dùng có tồn tại không (tùy chọn)
//         // const userExists = await User.findById(userIdToAdd);
//         // if (!userExists) {
//         //     return res.status(404).json({ error: 'Người dùng cần thêm không tồn tại.' });
//         // }


//         // Thêm thành viên
//         const updatedChat = await Conversation.findByIdAndUpdate(
//             chatId,
//             { $addToSet: { participants: userIdToAdd } }, // $addToSet để tránh thêm trùng lặp
//             { new: true }
//         )
//             .populate('participants', '-password')
//             .populate('groupAdmin', '-password');

//         if (!updatedChat) {
//              // Trường hợp này ít xảy ra nếu đã kiểm tra group tồn tại ở trên
//              return res.status(404).json({ error: 'Không tìm thấy nhóm sau khi cập nhật.' });
//         }
        

//         res.status(200).json(updatedChat);
//     } catch (error) {
//         console.error('Lỗi khi thêm thành viên:', error.message);
//         res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi thêm thành viên.' });
//     }
// });


// router.put('/remove', protectRoute, async (req, res) => {
//     const { chatId, userIdToRemove } = req.body;
//     const adminId = req.user._id;

//     if (!chatId || !userIdToRemove) {
//         return res.status(400).json({ error: 'Thiếu ID nhóm hoặc ID thành viên cần xóa.' });
//     }
//      if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userIdToRemove)) {
//         return res.status(400).json({ error: 'ID nhóm hoặc ID thành viên không hợp lệ.' });
//     }

//     // Admin không thể tự xóa mình bằng API này, nên có API rời nhóm riêng
//     if (adminId.toString() === userIdToRemove) {
//         return res.status(400).json({ error: 'Admin không thể tự xóa chính mình. Hãy dùng chức năng rời nhóm hoặc chuyển quyền admin.' });
//     }

//     try {
//          // Lấy thông tin nhóm và kiểm tra quyền admin
//         const group = await Conversation.findOne({
//             _id: chatId,
//             isGroupChat: true,
//             groupAdmin: adminId
//         });

//         if (!group) {
//              return res.status(403).json({ error: 'Không tìm thấy nhóm hoặc bạn không có quyền xóa thành viên.' });
//         }

//         // Kiểm tra xem người dùng có trong nhóm không
//         if (!group.participants.map(p => p.toString()).includes(userIdToRemove)) {
//              return res.status(404).json({ error: 'Người dùng này không có trong nhóm.' });
//         }

//         // Xóa thành viên
//         const updatedChat = await Conversation.findByIdAndUpdate(
//             chatId,
//             { $pull: { participants: userIdToRemove } },
//             { new: true }
//         )
//             .populate('participants', '-password')
//             .populate('groupAdmin', '-password');

//         if (!updatedChat) {
//              return res.status(404).json({ error: 'Không tìm thấy nhóm sau khi cập nhật.' });
//         }

//         // TODO: Gửi sự kiện socket tới các thành viên còn lại và người bị xóa

//         res.status(200).json(updatedChat);
//     } catch (error) {
//         console.error('Lỗi khi xóa thành viên:', error.message);
//         res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi xóa thành viên.' });
//     }
// });


// router.put('/leave', protectRoute, async (req, res) => {
//     const { chatId } = req.body;
//     const userId = req.user._id;

//     if (!chatId) {
//         return res.status(400).json({ error: 'Thiếu ID nhóm.' });
//     }
//      if (!mongoose.Types.ObjectId.isValid(chatId)) {
//         return res.status(400).json({ error: 'ID nhóm không hợp lệ.' });
//     }

//     try {
//         const group = await Conversation.findOne({ _id: chatId, isGroupChat: true });

//         if (!group) {
//             return res.status(404).json({ error: 'Không tìm thấy nhóm.' });
//         }

//         // Kiểm tra xem người dùng có trong nhóm không
//         if (!group.participants.map(p => p.toString()).includes(userId.toString())) {
//              return res.status(403).json({ error: 'Bạn không phải là thành viên của nhóm này.' });
//         }

//         // Nếu admin rời nhóm và là người cuối cùng -> Xóa nhóm? Hoặc chuyển quyền? (Logic phức tạp hơn)
//         // Hiện tại: Cho phép admin rời nhóm, nhóm sẽ không có admin (cần xử lý thêm nếu muốn chặt chẽ)
//         // Cân nhắc: Nếu admin rời đi và còn thành viên khác, có thể yêu cầu chỉ định admin mới trước khi rời.
//         // if (group.groupAdmin.toString() === userId.toString() && group.participants.length > 1) {
//         //     // return res.status(400).json({ error: 'Vui lòng chuyển quyền admin trước khi rời nhóm.' });
//         // }

//         // Xóa người dùng khỏi danh sách thành viên
//         const updatedChat = await Conversation.findByIdAndUpdate(
//             chatId,
//             { $pull: { participants: userId } },
//             { new: true }
//         );

//          // Tùy chọn: Nếu không còn thành viên nào -> Xóa luôn cuộc trò chuyện
//          if (updatedChat && updatedChat.participants.length === 0) {
//              await Conversation.findByIdAndDelete(chatId);
//              // TODO: Gửi sự kiện xóa nhóm
//              return res.status(200).json({ message: 'Rời nhóm thành công và nhóm đã được xóa do không còn thành viên.' });
//          } else if (updatedChat && group.groupAdmin.toString() === userId.toString()){
//             // Nếu admin rời đi, cập nhật admin thành null hoặc người đầu tiên còn lại (ví dụ)
//             await Conversation.findByIdAndUpdate(chatId, { groupAdmin: null }); // Hoặc chọn admin mới
//          }


//         if (!updatedChat) {
//              return res.status(404).json({ error: 'Không tìm thấy nhóm sau khi cập nhật.' });
//         }

//         // TODO: Gửi sự kiện socket tới các thành viên còn lại về việc có người rời nhóm

//         res.status(200).json({ message: 'Rời nhóm thành công.' });
//     } catch (error) {
//         console.error('Lỗi khi rời nhóm:', error.message);
//         res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi rời nhóm.' });
//     }
// });


module.exports = router;
