const express = require('express');
const protectRoute = require('../middleware/verify.js');
const User = require('../models/userModel.js');
const Conversation = require('../models/conversation.js');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/conversations', protectRoute, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const conversations = await Conversation.find({ participants: loggedInUserId })
      .sort({ updatedAt: -1 })
      .populate({
        path: 'participants',
        select: '-password',
      })
      .populate('groupAdmin', '-password')
      .populate({
        path: 'messages',
        options: { sort: { createdAt: -1 }, limit: 1 },
      });

    // Trả về conversation nguyên vẹn, chat 1-1 hay group đều giống nhau
    const formattedConversations = conversations.map((conv) => {
      const lastMessage = conv.messages.length > 0 ? conv.messages[0] : null;

      return {
        ...conv.toObject(), // chuyển document Mongoose thành object JS
        isGroup: !!conv.isGroupChat,
        lastMessage: lastMessage
          ? {
              _id: lastMessage._id,
              senderId: lastMessage.senderId,
              message: lastMessage.message,
              createdAt: lastMessage.createdAt,
            }
          : null,
      };
    });

    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách conversations:', error.message);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});


router.get('/', protectRoute, async (req, res) => {
  try {
    const users = await User.find({_id: { $ne: req.user._id }}).select('-password');

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ khi tìm kiếm người dùng' });
  }
});


router.get('/search', protectRoute, async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword) return res.status(400).json({ error: 'Thiếu từ khóa tìm kiếm' });

    // Tìm user theo từ khóa, loại bỏ chính user
    const users = await User.find({
      fullname: { $regex: keyword, $options: 'i' },
      _id: { $ne: req.user._id }
    }).select('-password');

    // Lấy conversation hiện tại nếu có
    const result = await Promise.all(users.map(async (user) => {
      let conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, user._id] },
        isGroupChat: false
      }).populate('participants', '-password');

      // Nếu chưa có conversation thì tạo mới (chỉ return object conversation, không lưu DB nếu muốn)
      if (!conversation) {
        conversation = {
          _id: null, // chưa có id
          participants: [req.user, user],
          isGroupChat: false,
          messages: []
        };
      }

      return conversation;
    }));

    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ khi tìm kiếm người dùng' });
  }
});


module.exports = router;
