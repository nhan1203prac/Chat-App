const mongoose = require("mongoose");

const connectToMongooseDB = async()=>{
    try {
        await mongoose.connect("mongodb://localhost:27017/chat-app-group",{useNewUrlParser: true,useUnifiedTopology: true})
        console.log("Connected to MongoDB")
    } catch (error) {
        console.log("Error connecting to mongooseDb", error,message)
    }
}   

module.exports= connectToMongooseDB