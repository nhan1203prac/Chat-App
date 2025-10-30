const express = require("express");
const Conversation = require("../models/conversation");
const Message = require("../models/messageModel");
const verify = require("../middleware/verify");
// const { getReceiverSocketId, io } = require("../server");
const { getReceiverSocketId, io } =  require("../socket/socket.js");
const router = express.Router();
router.post("/send/:id", verify, async (req, res) => {
  try {
    const { message } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    // Tìm conversation giữa 2 người
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // Nếu chưa có conversation → tạo mới
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    let newMessage = null;

    // Chỉ tạo message nếu có nội dung
    if (message && message.trim() !== "") {
      newMessage = new Message({
        senderId,
        receiverId,
        message,
        conversationId: conversation._id,
      });

      conversation.messages.push(newMessage._id);

      // Lưu conversation + message
      await Promise.all([conversation.save(), newMessage.save()]);

      // Populate senderId và receiverId của message
      await newMessage.populate([
        { path: "senderId", select: "_id fullname username profilePic" },
        { path: "receiverId", select: "_id fullname username profilePic" },
      ]);
    }

    // Populate conversation giống API GET /conversations
    conversation = await Conversation.findById(conversation._id)
      .populate({ path: "participants", select: "-password" })
      .populate("groupAdmin", "-password")
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 },
        populate: [
          { path: "senderId", select: "_id fullname username profilePic" },
          { path: "receiverId", select: "_id fullname username profilePic" },
        ],
      });

    const lastMessage = conversation.messages.length > 0 ? conversation.messages[0] : null;

    const formattedConversation = {
      ...conversation.toObject(),
      isGroup: !!conversation.isGroupChat,
      lastMessage: lastMessage
        ? {
            _id: lastMessage._id,
            senderId: lastMessage.senderId,
            message: lastMessage.message,
            createdAt: lastMessage.createdAt,
          }
        : null,
    };

    // Gửi socket cho người nhận nếu có message
    if (newMessage) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", {
          message: newMessage,
          conversation: formattedConversation,
        });
      }
    }

    // Trả về sender
    res.status(201).json({ message: newMessage, conversation: formattedConversation });
  } catch (error) {
    console.log("Error in sendMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.get("/:id", verify, async (req, res) => {
  try {
    const userToChatId = req.params.id;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] }
    }).populate({
      path: "messages",
      populate: [
        { path: "senderId", select: "_id fullname username profilePic" },
        { path: "receiverId", select: "_id fullname username profilePic" }
      ]
    });

    if (!conversation) return res.status(200).json([]);

    res.status(200).json(conversation.messages);
  } catch (error) {
    console.log("Error in getMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.post("/send-group/:groupId", verify, async (req, res) => {
  try {
    const { message } = req.body;
    const senderId = req.user._id;
    const groupId = req.params.groupId;

    const group = await Conversation.findOne({ _id: groupId, isGroupChat: true });
    if (!group) return res.status(404).json({ error: "Không tìm thấy nhóm" });

    const newMessage = await Message.create({
      senderId,
      receiverId: null,
      message,
      conversationId: groupId,
    });

    group.messages.push(newMessage._id);
    await group.save();

    io.to(groupId.toString()).emit("newGroupMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (err) {
    console.log("error", err.message)
    res.status(500).json({ error: "Lỗi gửi tin nhóm" });
  }
});

// messages.js
router.get("/group/:groupId", verify, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await Conversation.findOne({ _id: groupId, isGroupChat: true }).populate("messages");
    if (!group) return res.status(404).json({ error: "Không tìm thấy nhóm" });

    res.status(200).json(group.messages);
  } catch (err) {
    res.status(500).json({ error: "Lỗi load tin nhắn nhóm" });
  }
});


module.exports = router
