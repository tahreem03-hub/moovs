const User = require("../models/User");
const ErrorHandler = require("../utils/ErrorHandler");
const sendToken = require("../utils/jwtToken");

const createActivationToken = (user) => {
    return jwt.sign(user, process.env.ACTIVATION_SECRET, {
        expiresIn: process.env.ACTIVATION_EXPIRES,
    });
};


const createUser = async (req, res, next) => {
    try {

        const { Fname, Lname, email, CompanyName, password } = req.body;

        const userEmail = await User.findOne({ email });

        if (userEmail) {
            return next(new ErrorHandler("User already exists", 400));
        }


        const user = {
            Fname,
            Lname,
            email,
            password,
            CompanyName,
        };

        const newUser = await User.create(user);

        sendToken(newUser, 201, res);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: newUser
        });



    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
}


const loginUser = async (req, res, next) => {
    try {

        
        const { email, password } = req.body
        const user = await User.findOne({ email })

        
        if (!user) {
            return next(new ErrorHandler("User not found", 400));
        }


        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return next(new ErrorHandler("Invalid password", 400));
        }

       
        sendToken(user, 200, res);
        res.status(200).json({
            success: true,
            message: "Login successful",
        });

    } catch (error) {
        next(new ErrorHandler(error.message, 400));
    }
};


module.exports = {
    createUser,
    loginUser
};

