const mongoose = require("mongoose")

const conversationSchema = new mongoose.Schema({
    participants:[
        {type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }

    ],
    messages:[
        {type:mongoose.Schema.Types.ObjectId,
            ref:"Message",
            default:[]
        }
    ],
    isGroupChat: {
            type: Boolean,
            default: false, 
        },
        groupName: {
            type: String,
            trim: true,
            required: function() {
                return this.isGroupChat; 
            },
        },
        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: function() {
                return this.isGroupChat; 
            },
        },
},{timestamps:true})

module.exports = mongoose.model("Conversation",conversationSchema)