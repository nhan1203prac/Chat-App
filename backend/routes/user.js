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

    const formattedConversations = conversations
      .map((conv) => {
        let displayData = {};
        const lastMessage = conv.messages.length > 0 ? conv.messages[0] : null;

        if (conv.isGroupChat) {
          // Nhóm chat
          displayData = {
            _id: conv._id,
            isGroup: true,
            groupName: conv.groupName,
            groupAdmin: conv.groupAdmin,
            profilePic: conv.groupAdmin?.profilePic || '',
            participants: conv.participants,
            lastMessage: lastMessage
              ? {
                  _id: lastMessage._id,
                  senderId: lastMessage.senderId,
                  message: lastMessage.message,
                  createdAt: lastMessage.createdAt,
                }
              : null,
            updatedAt: conv.updatedAt,
          };
        } else {
          // Chat 1-1
          const otherParticipant = conv.participants.find(
            (p) => p._id.toString() !== loggedInUserId.toString()
          );

          if (!otherParticipant) return null;

          displayData = {
            _id: otherParticipant._id,
            isGroup: false,
            fullname: otherParticipant.fullname,
            username: otherParticipant.username,
            profilePic: otherParticipant.profilePic,
            conversationId: conv._id,
            lastMessage: lastMessage
              ? {
                  _id: lastMessage._id,
                  senderId: lastMessage.senderId,
                  message: lastMessage.message,
                  createdAt: lastMessage.createdAt,
                }
              : null,
            updatedAt: conv.updatedAt,
          };
        }

        return displayData;
      })
      .filter((item) => item !== null);

    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách users/conversations:', error.message);
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

    const users = await User.find({
      fullname: { $regex: keyword, $options: 'i' },
      _id: { $ne: req.user._id }
    }).select('-password');

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ khi tìm kiếm người dùng' });
  }
});


module.exports = router;
