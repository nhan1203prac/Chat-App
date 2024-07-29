const express = require("express")
const verify = require("../middleware/verify");
const User = require("../models/userModel");
const router = express.Router()

router.get("/",verify,async(req,res)=>{
    try {
        const loggedInUserId = req.user._id;
        const filterUser = await User.find({_id:{$ne:loggedInUserId}}).select("-password");

        res.status(200).json(filterUser)
    } catch (error) {
        console.log("Error in getUserForSidebar: ",error.message);
        res.status(500).json({error: "Internal server error"})
    }
})

module.exports=router