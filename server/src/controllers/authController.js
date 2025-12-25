const User=require('../models/User');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');

//SIGNUP
exports.signup=async(req,res)=>{
    try{
        const {username,email,password}=req.body;

        if(!username || !email || !password){
            return res.status(400).json({message:"All fields are required"});
        }

        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:"User already exists"});
        }
        
        const hashedPassword=await bcrypt.hash(password,10);

        const user=await User.create({
            username,
            email,
            password:hashedPassword
        });

        return res.status(201).json({message:"User created successfully"});
    }catch(error){
        res.status(500).json({ message: "Signup failed", error });
    }
};

//LOGIN
exports.login=async(req,res)=>{
    try{
        const {email,password}=req.body;

        if(!email || !password){
            return res.status(400).json({message:"All fields are required"});
        }

        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"Invalid credentials"});
        }

        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid credentials"});
        }

        const token=jwt.sign(
            {userId:user._id},
            process.env.JWT_SECRET,
            {expiresIn:'1h'}
        );

        return res.status(200).json({message: "Login successful",
      token});
    }
    catch(error){
        res.status(500).json({ message: "Login failed", error });
    }
};