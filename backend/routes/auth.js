const express = require("express");
const router = express.Router();
const User = require("../models/userModel")
const bcrypt = require("bcryptjs")
const jwt =require("jsonwebtoken")


router.post("/signup",async(req,res)=>{
    try {
        const {fullname,username,password,confirmPassword,gender} = req.body
        if(password!==confirmPassword){
            return res.status(400).json({error:"Password don't match"})
        }
        const user = await User.findOne({username})
        if(user){
            return res.status(400).json({error:"Username already exists"})
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password,salt)
        const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`
        const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`
        const newUser = new User({
            fullname,
            username,
            password:hashPassword,
            gender,
            profilePic:gender==="male"?boyProfilePic:girlProfilePic,

        })
        const savedUser = await newUser.save()
        const token = jwt.sign({id:savedUser._id},process.env.JWT_SECRET,{expiresIn:"15d",})
        res.cookie("jwt",token,{
            maxAge: 15 * 24 * 60 * 60 * 1000,
            httpOnly: true, 
            sameSite: "strict", 
    })
        const {password:hashedPassword ,...info} = savedUser._doc
        res.status(201).json(info)
    } catch (error) {
        console.log("Error in signup controller",error.message);
        res.status(500).json({error:"Internal Server Error"})
    }
})



// router.get("/signup", async (req, res) => {
//     try {
//         const username = "nhanVo";
//         const gender = "male";
//         const salt = await bcrypt.genSalt(10);
//         const hashPassword = await bcrypt.hash("123456", salt);
//         const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
//         const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;
//         const newUser = new User({
//             fullname: "VoThanhNhan",
//             username: username,
//             password: hashPassword,
//             gender: gender,
//             profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
//         });
//         const savedUser = await newUser.save();
//         const { password: hashedPassword, ...info } = savedUser._doc;
//         res.status(201).json(info);
//     } catch (error) {
//         console.error("Error in signup controller", error.message);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });


router.post("/login",async(req,res)=>{
    try {
       const {username,password} = req.body
        const user = await User.findOne({username})
        const isPasswordCorrect = await bcrypt.compare(password,user?.password || "")

        if(!user || !isPasswordCorrect){
           return res.status(400).json({error:"Invalid username or password"});
        }
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"15d",})
        res.cookie("jwt",token,{
            maxAge: 15 * 24 * 60 * 60 * 1000, // MS
            httpOnly: true, // prevent XSS attacks cross-site scripting attacks
            sameSite: "strict", // CSRF attacks cross-site request forgery attacks
    })
        const {password:pw,...info} = user._doc
        res.status(200).json(info)
    } catch (error) {
        console.log("Error in login controller",error.message);
        res.status(500).json({error:"Internal Server Error"})
    }
})

router.get("/login",async(req,res)=>{
    try {
    //    const {username,password} = req.body
        const user = await User.findOne({username:"nhanVo"})
        const isPasswordCorrect = await bcrypt.compare("123456",user?.password || "")

        if(!user || !isPasswordCorrect){
            res.status(400).json("Invalid username or password");
        }
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"15d",})
        res.cookie("jwt",token,{
            maxAge: 15 * 24 * 60 * 60 * 1000, // MS
            httpOnly: true, // prevent XSS attacks cross-site scripting attacks
            sameSite: "strict", // CSRF attacks cross-site request forgery attacks
    })
        const {password:pw,...info} = user._doc
        res.status(200).json({...info})
    } catch (error) {
        console.log("Error in signup controller",error.message);
        res.status(500).json({error:"Internal Server Error"})
    }
})

router.post("/logout",(req,res)=>{
    try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
})
module.exports = router