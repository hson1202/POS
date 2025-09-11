const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const register = async (req, res, next) => {
    try {

        const { name, phone, email, password, role } = req.body;

        if(!name || !phone || !email || !password || !role){
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({email});
        if(isUserPresent){
            const error = createHttpError(400, "User already exist!");
            return next(error);
        }


        const user = { name, phone, email, password, role };
        const newUser = User(user);
        await newUser.save();

        res.status(201).json({success: true, message: "New user created!", data: newUser});


    } catch (error) {
        next(error);
    }
}


const login = async (req, res, next) => {

    try {
        
        const { email, password } = req.body;

        if(!email || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({email});
        if(!isUserPresent){
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        if(!isMatch){
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const accessToken = jwt.sign({_id: isUserPresent._id}, config.accessTokenSecret, {
            expiresIn : '1d'
        });

        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 *24 * 30,
            httpOnly: true,
            sameSite: 'none',
            secure: true
        })

        res.status(200).json({success: true, message: "User login successfully!", 
            data: {
                ...isUserPresent.toObject(),
                token: accessToken // Include token in response for API testing
            }
        });


    } catch (error) {
        next(error);
    }

}

const getUserData = async (req, res, next) => {
    try {
        
        const user = await User.findById(req.user._id);
        res.status(200).json({success: true, data: user});

    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        
        res.clearCookie('accessToken');
        res.status(200).json({success: true, message: "User logout successfully!"});

    } catch (error) {
        next(error);
    }
}

// Lấy tất cả users (chỉ admin)
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json({success: true, data: users});
    } catch (error) {
        next(error);
    }
}

// Cập nhật user (chỉ admin)
const updateUser = async (req, res, next) => {
    try {
        const { name, email, phone, role } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            const error = createHttpError(404, "User not found!");
            return next(error);
        }

        // Cập nhật thông tin cơ bản
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (role) user.role = role;

        // Cập nhật password nếu có
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        await user.save();
        
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(200).json({success: true, message: "User updated successfully!", data: userResponse});
    } catch (error) {
        next(error);
    }
}

// Xóa user (chỉ admin)
const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            const error = createHttpError(404, "User not found!");
            return next(error);
        }

        // Không cho phép xóa admin
        if (user.role === 'admin') {
            const error = createHttpError(403, "Cannot delete admin user!");
            return next(error);
        }

        await User.findByIdAndDelete(userId);
        res.status(200).json({success: true, message: "User deleted successfully!"});
    } catch (error) {
        next(error);
    }
}

module.exports = { register, login, getUserData, logout, getAllUsers, updateUser, deleteUser }