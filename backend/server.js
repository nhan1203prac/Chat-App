const express = require('express')

const cors = require('cors')
// const http = require('http')
const authRoute = require("./routes/auth")
const messageRoute = require("./routes/message")
const userRoute = require("./routes/user")
const groupRoutes = require("./routes/group.js")
const connectToMongooseDB = require("./db/ConnecToDB")
const dotenv = require("dotenv")
// const server = http.createServer(app)
// const {Server} = require('socket.io')
const { app, server,io } = require("./socket/socket.js");
const cookieParser = require("cookie-parser")
dotenv.config()

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);


// const io = new Server(server,{
//     cors: {
//         origin: ["http://localhost:3000"],
//         methods: ["GET", "POST"],
//     },
// })

// const userSocketMap = {}
// const getReceiverSocketId = (receiverId) => {
//     return userSocketMap[receiverId]
// }


// io.on("connection",(socket)=>{
//     console.log("a user connected",socket.id)
//     const userId = socket.handshake.query.userId
//     if(userId!=="undefined") userSocketMap[userId] = socket.id

//     io.emit("getOnlineUsers",Object.keys(userSocketMap))
//     socket.on("disconnect",()=>{
//         console.log("User disconnected",socket.id)
//         delete userSocketMap[userId]
//         io.emit("getOnlineUsers",Object.keys(userSocketMap))
//     })
// })

app.use(express.json())
app.use(cookieParser())

// Serve static files cho uploads
app.use('/uploads', express.static('uploads'))

app.use("/api/auth",authRoute)
app.use("/api/messages",messageRoute)
app.use("/api/users",userRoute)
app.use('/api/groups', groupRoutes)
server.listen(8800,()=>{
    connectToMongooseDB()
    console.log("Backend server is running!");
})


app.set('socketio', io)

// module.exports = { getReceiverSocketId, io } // Xuất cả getReceiverSocketId và io
