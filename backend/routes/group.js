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


router.put('/rename', protectRoute, async (req, res) => {
    const { chatId, groupName } = req.body;
    const userId = req.user._id;

    if (!chatId || !groupName || !groupName.trim()) {
        return res.status(400).json({ error: 'Thiếu ID nhóm hoặc tên nhóm mới.' });
    }
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ error: 'ID nhóm không hợp lệ.' });
    }


    try {
        const updatedChat = await Conversation.findOneAndUpdate(
            {
                _id: chatId,
                isGroupChat: true,
                groupAdmin: userId, 
            },
            { groupName: groupName.trim() },
            { new: true } 
        )
            .populate('participants', '-password')
            .populate('groupAdmin', '-password');

        if (!updatedChat) {
            return res.status(404).json({
                error: 'Không tìm thấy nhóm hoặc bạn không có quyền đổi tên nhóm này.',
            });
        }
        console.log("groupNamed ",chatId)
        io.to(chatId).emit('groupNamed',{
            chatId,
            newName:updatedChat.groupName,
            updatedBy:req.user
        })

        res.status(200).json(updatedChat);
    } catch (error) {
        console.error('Lỗi khi đổi tên nhóm:', error.message);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi đổi tên nhóm.' });
    }
});

router.put('/add-member', protectRoute,async(req,res)=>{
    const {chatId, userIdToAdd} = req.body;
    const adminId = req.user._id
    if(!chatId || !userIdToAdd){
        return res.status(400).json({error: 'Thiếu Id nhóm hoặc Id thành viên cần thêm'})
    }
    if(!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userIdToAdd)){
        return res.status(400).json({error: 'Id nhóm hoặc Id thành viên không hợp lệ'})
    }
    try {
        const group = await Conversation.findOne({
            _id:chatId,
            isGroupChat:true,
            groupAdmin:adminId
        })
        if(!group){
            return res.status(403).json({error: 'Không tìm thấy nhóm hoặc bạn không có quyền thêm thành viên'})
        }
        if(group.participants.includes(userIdToAdd)){
            return res.status(400).json({error: 'Người dùng này đã ở trong nhóm rồi'})
        }
        const userExist = await User.findById(userIdToAdd)
        if(!userExist){
            return res.status(400).json({error:'Người dùng không tồn tại'})
        }
        const chatUpdated = await Conversation.findByIdAndUpdate(chatId,
            {$addToSet:{participants:userIdToAdd}},
            {new:true})
            .populate('participants', '-password')
            .populate('groupAdmin','-password')
        chatUpdated.participants.forEach((user) => {
            const receiveSocketId = getReceiverSocketId(user._id);
            if (receiveSocketId) {
                io.to(receiveSocketId).emit('memberAdded', {
                conversation: chatUpdated,
                userAdded: userExist,
                updatedBy: req.user,
                });
            }
        });

        return res.status(200).json(chatUpdated)
    } catch (error) {
        console.log("add member api ",error.message)
        res.status(500).json({error:'Lỗi khi thêm thành viên'})
    }
})

router.put('/remove',protectRoute,async(req,res)=>{
    const {chatId,userIdToRemove} = req.body
    const adminId = req.user._id
    if(!chatId || !userIdToRemove){
        return res.status(400).json({error: 'Thiếu Id nhóm hoặc ID thành viên cần xóa'})
    }
    if(!mongoose.Types.ObjectId.isValid(chatId) || mongoose.Types.ObjectId.isValid(userIdToRemove)){
        return res.status(400).json({error: 'Id nhóm hoặc Id thành viên không hợp lệ'})
    }
    if(adminId.toString() === userIdToRemove){
        return res.status(400).json({error: 'Admin không thể tự xóa chính mình'})
    }
    try {
        const group = await Conversation.findOne({
            _id:chatId,
            isGroupChat:true,
            groupAdmin:adminId
        })
        if(!group){
            return res.status(403).json({error: 'Không tìm thấy nhóm hoặc bạn không có quyền thêm thành viên'})
        }
        if(!group.participants.includes(userIdToAdd)){
            return res.status(400).json({error: 'Người dùng này không có ở trong nhóm'})
        }

        const chatUpdated = await Conversation.findByIdAndUpdate(chatId,
            {$pull:{participants:userIdToRemove}},
            {new:true}
        ).populate('participants','-password')
        .populate('groupAdmin','-password')
        io.to(chatId).emit('memberRemoved', { chatId, userIdToRemove, updatedBy: req.user });
        return res.status(200).json({chatUpdated})
    } catch (error) {
        console.log(error.message)
        res.status(500).json({error:"Lỗi khi kick thành viên"})
    }
})



router.put('/leave', protectRoute, async (req, res) => {
    const { chatId } = req.body;
    const userId = req.user._id;

    if (!chatId) {
        return res.status(400).json({ error: 'Thiếu ID nhóm.' });
    }
     if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ error: 'ID nhóm không hợp lệ.' });
    }

    try {
        const group = await Conversation.findOne({ _id: chatId, isGroupChat: true });

        if (!group) {
            return res.status(404).json({ error: 'Không tìm thấy nhóm.' });
        }

        if (!group.participants.map(p => p.toString()).includes(userId.toString())) {
            return res.status(403).json({ error: 'Bạn không phải là thành viên của nhóm này.' });
        }

        if (group.groupAdmin.toString() === userId.toString()) {
            return res.status(403).json({
                error: 'Bạn là quản trị viên của nhóm. Hãy hủy nhóm thay vì rời khỏi.'
            });
        }
        const updatedChat = await Conversation.findByIdAndUpdate(
            chatId,
            { $pull: { participants: userId } },
            { new: true }
        );

         if (updatedChat && updatedChat.participants.length === 0) {
             await Conversation.findByIdAndDelete(chatId);
             return res.status(200).json({ message: 'Rời nhóm thành công và nhóm đã được xóa do không còn thành viên.' });
         } 


        if (!updatedChat) {
             return res.status(404).json({ error: 'Không tìm thấy nhóm sau khi cập nhật.' });
        }

        io.to(chatId).emit('memberLeft', { chatId, userId, updatedBy: req.user });
        return res.status(200).json({ message: 'Rời nhóm thành công.' });
    } catch (error) {
        console.error('Lỗi khi rời nhóm:', error.message);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi rời nhóm.' });
    }
});

router.delete('/delete',protectRoute,async(req,res)=>{
    const {chatId} = req.body
    const adminId = req.user._id
    if(!chatId){
        return res.status(400).json({error:"Thiếu id nhóm"})
    }
    if(mongoose.Types.ObjectId.isValid(chatId)){{   
        return res.status(400).json({error:"Id nhóm không hợp lệ"})
    }}

    try {
        const group = await Conversation.findById(chatId);
        if (!group) return res.status(404).json({ error: 'Không tìm thấy nhóm.' });

        if (group.groupAdmin.toString() !== adminId.toString())
        return res.status(403).json({ error: 'Chỉ admin mới có thể xóa nhóm.' });

        await Conversation.findByIdAndDelete(chatId);

        io.to(chatId).emit('groupDeleted', { chatId, deletedBy: req.user });

        res.status(200).json({ message: 'Xóa nhóm thành công.' });
    } catch (error) {
        console.log("delete group ",error.message)
        res.status(500).json({error:"Lỗi máy chủ nội bộ khi xóa nhóm"})
    }
})

module.exports = router;
