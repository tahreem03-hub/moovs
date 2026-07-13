const User = require("../models/User");
const ErrorHandler = require("../utils/ErrorHandler");

const createActivationToken = (user) => {
    return jwt.sign(user, process.env.ACTIVATION_SECRET, {
        expiresIn: process.env.ACTIVATION_EXPIRES,
    });
};


module.exports = createUser = async (req, res, next) => {
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

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: newUser
        });



    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
}

