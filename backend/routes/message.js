const express = require("express");
const Conversation = require("../models/conversation");
const Message = require("../models/messageModel");
const verify = require("../middleware/verify");
const { getReceiverSocketId, io } =  require("../socket/socket.js");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Cấu hình multer để lưu ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh hoặc video!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB cho video
});
router.post("/send/:id", verify, upload.single('file'), async (req, res) => {
  try {
    const { message } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;
    
    let image = null;
    let video = null;
    if (req.file) {
      const filePath = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith('image/')) {
        image = filePath;
      } else if (req.file.mimetype.startsWith('video/')) {
        video = filePath;
      }
    }

    // tìm cuộc trò chuyện
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      isGroupChat:false
    });

    // check nếu chưa tạo thì tạo
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    let newMessage = null;

    // Tạo message nếu có nội dung hoặc có ảnh/video
    if ((message && message.trim() !== "") || image || video) {
      newMessage = new Message({
        senderId,
        receiverId,
        message: message || "",
        image,
        video,
        conversationId: conversation._id,
      });
      // đẩy id message vô messages
      conversation.messages.push(newMessage._id);

      await Promise.all([conversation.save(), newMessage.save()]);

      await newMessage.populate([
        { path: "senderId", select: "_id fullname username profilePic" },
        { path: "receiverId", select: "_id fullname username profilePic" },
      ]);
    }
    // lấy thông tin conversation và mở rộng thêm cái ref
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
    // lấy message cuối, nhưng bên frontend k dùng thì ok hơn
    const lastMessage = conversation.messages.length > 0 ? conversation.messages[0] : null;
    // config dữ liệu trả emit về client. Chú ý là định dạng này giống cái api search bên users
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

    // emit cả tin nhắn vừa tạo và cả conversation vì lúc mà khi vừa search tên xong ta gửi tin nhắn thì chưa có converation nên ta thêm vô đây để client thêm vào
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


// lấy conversation ra với tất cả message
router.get("/:id", verify, async (req, res) => {
  try {
    const userToChatId = req.params.id;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
      isGroupChat:false
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


// gửi với nhóm
router.post("/send-group/:groupId", verify, upload.single('file'), async (req, res) => {
  try {
    const { message } = req.body;
    const senderId = req.user._id;
    const groupId = req.params.groupId;
    
    let image = null;
    let video = null;
    if (req.file) {
      const filePath = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith('image/')) {
        image = filePath;
      } else if (req.file.mimetype.startsWith('video/')) {
        video = filePath;
      }
    }

    const group = await Conversation.findOne({ _id: groupId, isGroupChat: true });
    if (!group) return res.status(404).json({ error: "Không tìm thấy nhóm" });

    const newMessage = await Message.create({
      senderId,
      receiverId: null,
      message: message || "",
      image,
      video,
      conversationId: groupId,
    });

    group.messages.push(newMessage._id);
    await group.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "-password")
      .lean(); 

    io.to(groupId.toString()).emit("newGroupMessage", populatedMessage);

    res.status(201).json({ message: populatedMessage });
  } catch (err) {
    console.log("error", err.message)
    res.status(500).json({ error: "Lỗi gửi tin nhóm" });
  }
});

router.get("/group/:groupId", verify, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await Conversation.findOne({ _id: groupId, isGroupChat: true }).populate({
      path: "messages",
      populate: [
        { path: "senderId", select: "_id fullname username profilePic" }
      
      ]
    });
    if (!group) return res.status(404).json({ error: "Không tìm thấy nhóm" });

    res.status(200).json(group.messages);
  } catch (err) {
    res.status(500).json({ error: "Lỗi load tin nhắn nhóm" });
  }
});



module.exports = router
