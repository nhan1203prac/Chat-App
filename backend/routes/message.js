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
            message
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

module.exports = router
