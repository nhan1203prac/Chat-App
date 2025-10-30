const express = require("express");
const Conversation = require("../models/conversation");
const Message = require("../models/messageModel");
const verify = require("../middleware/verify");
// const { getReceiverSocketId, io } = require("../server");
const { getReceiverSocketId, io } =  require("../socket/socket.js");
const router = express.Router();

router.post("/send/:id",verify,async(req,res)=>{
    try {
        const {message} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id
        console.log("conversationId ",receiverId)

        let conversation = await Conversation.findOne({
            participants:{$all:[senderId,receiverId]}
        })

       
        
        if(!conversation){
            conversation = await Conversation.create({
                participants:[senderId,receiverId]
            })
        }
        const newMessage =  new Message({
            senderId,
            receiverId,
            message,
            conversationId: conversation._id,
        })
        if(newMessage)
            conversation.messages.push(newMessage._id)

        // await conversation.save()
        // await newMessage.save()
        await Promise.all([conversation.save(), newMessage.save()]);

        const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}


        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage: ",error.message);
        res.status(500).json({error: "Internal server error"})
    }
})


router.get("/:id",verify,async(req,res)=>{
    try {
        const userToChatId = req.params.id;
        const senderId = req.user._id;

        const conversation =await Conversation.findOne({
            participants:{$all:[senderId,userToChatId]}
        }).populate("messages")
        if(!conversation)
          return  res.status(200).json([])
        const messages = conversation.messages
        res.status(200).json(messages)
    } catch (error) {
        console.log("Error in getMessage: ",error.message);
        res.status(500).json({error: "Internal server error"})
    }
})


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
