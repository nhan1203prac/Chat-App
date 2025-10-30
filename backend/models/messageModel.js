const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    senderId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    receiverId:{type:mongoose.Schema.Types.ObjectId,ref:"User", default:null},
    message:{type:String,required:true},
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
},{timestamps:true})

module.exports = mongoose.model("Message",messageSchema);