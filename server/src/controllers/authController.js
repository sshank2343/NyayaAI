const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');

const BCRYPT_PREFIX = '$2';

//Generate 15-minute Access Token
const generateAccessToken=(id)=>{
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:'15m'});
}

//Generate 7-day Refresh Token
const generateRefreshToken=(id)=>{
    return jwt.sign({id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn:'7d'});
};

// Helper function to set the server secure cookie

const setRefreshTokenCookie = (res,token)=>{
    res.cookie('jwt',token,{
        httpOnly:true, // Prevents JS (XSS)from reading the cookie
        secure:process.env.NODE_ENV === 'production', // Use secure HTTPS in production
        sameSite:'strict', // Prevents CSRP attacks
        maxAge:7*24*60*60*1000 // 7 days in milliseconds
    });
};

// @desc   Register a new user
// @route  POST /api/auth/register

const registerUser=async(req,res)=>{
    try{
        console.log('1. Register started');
        const {name,email,password}=req.body;
        console.log('2. Extracted fields:', {name, email});

        const userExists = await User.findOne({email});
        console.log('3. User exists check done:', userExists ? 'EXISTS' : 'NEW');
        if(userExists){
            return res.status(400).json({message:"User with this Email is already registered."});
        }
        
        // Hash password before creating user
        console.log('4. Starting password hash');
        const salt = await bcrypt.genSalt(10);
        console.log('5. Salt generated');
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('6. Password hashed');
        
        const user = await User.create({name,email,password:hashedPassword});
        console.log('7. User created:', user._id);
        if(user){
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);
            setRefreshTokenCookie(res,refreshToken);
            res.status(201).json({
                _id:user._id,
                name:user.name,
                email:user.email,
                accessToken
            })
        }else{
            res.status(400).json({message:"Invalid user data."});
        }
    } catch(error){
        console.error('ERROR in registerUser:', error.message, error.stack);
        res.status(500).json({message:error.message});
    }
};


// @desc   Authenticate user & get tokens
// @route  POST /api/auth/login

const loginUser = async(req,res)=>{
    try{
        const {email,password}=req.body;
        const user=await User.findOne({email});

        let passwordMatch = false;
        if (user) {
            if (typeof user.password === 'string' && user.password.startsWith(BCRYPT_PREFIX)) {
                passwordMatch = await bcrypt.compare(password, user.password);
            } else {
                // Backward compatibility for any legacy plaintext-password records.
                passwordMatch = password === user.password;
                if (passwordMatch) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(password, salt);
                    await user.save();
                }
            }
        }

        if(user && passwordMatch){
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            setRefreshTokenCookie(res,refreshToken);

            res.status(200).json({
                _id:user._id,
                name:user.name,
                email:user.email,
                accessToken
            })
        }else{
            res.status(401).json({message:"Invalid email or password."});
        }
    }catch(error){
        res.status(500).json({message:error.message});
    }
}

// @desc Get new access token using refresh token
//  @route GET /api/auth/refresh
const refreshAccessToken = async (req,res)=>{
    try{
        const cookies = req.cookies;
        if(!cookies?.jwt){
            return res.status(401).json({message:"No refresh token provided."});
        }
        const refreshToken = cookies.jwt;

        // Verify the refresh token using promise-based approach
        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded)=>{
                if(err) reject(new Error("Invalid refresh token."));
                else resolve(decoded);
            });
        });

        //  if valid, generate a new access token
        const accessToken = generateAccessToken(decoded.id);
        res.status(200).json({accessToken});
    } catch(error){
        res.status(403).json({message:error.message});
    }
}

// @desc    Logout user and clear cookie
// @route   POST /api/auth/logout
const logoutUser = async (req, res) => {
    // Clear the HTTP-Only cookie so the session is completely destroyed
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.status(200).json({ message: "Successfully logged out." });
};

module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser };