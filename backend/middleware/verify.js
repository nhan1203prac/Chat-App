const jwt = require("jsonwebtoken");
const User = require("../models/userModel")


const verify = async(req,res,next)=>{
    try {
        const token = req.cookies.jwt

        if(!token)
            return res.status(401).json({error:"Unauthorized - No token provided"})

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded)
            return res.status(401).json({error:"Unauthorized - Invalid token"});
        const user = await User.findById(decoded.id).select("-password");
        if(!user)
            return res.status(401).json({error: "User not found"})

        req.user = user
        next();
    } catch (error) {
        console.log("Error in verify middleware: ",error.message);
        res.status(500).json({error:"Internal server error"})
    }
}
module.exports = verify