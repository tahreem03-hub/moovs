const User = require("../models/User");
const ErrorHandler = require("../utils/ErrorHandler");
const sendToken = require("../utils/jwtToken");
const jwt = require('jsonwebtoken');

const createActivationToken = (user) => {
    return jwt.sign(user, process.env.ACTIVATION_SECRET, {
        expiresIn: process.env.ACTIVATION_EXPIRES,
    });
};

// ============ SELF REGISTRATION (Operator) ============
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
            // ✅ Self-registered user - createdBy is null
            createdBy: null,
            role: 'user',
            isActive: true,
            subscriptionPlan: 'free',
            subscriptionStatus: 'trial'
        };

        const newUser = await User.create(user);
        sendToken(newUser, 201, res);

    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
};

// ============ LOGIN ============
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return next(new ErrorHandler("User not found", 400));
        }

        // ✅ Check if user is active
        if (!user.isActive) {
            return next(new ErrorHandler("Your account has been deactivated. Please contact support.", 403));
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return next(new ErrorHandler("Invalid password", 400));
        }

        sendToken(user, 200, res, "Login Successful");

    } catch (error) {
        next(new ErrorHandler(error.message, 400));
    }
};

// ============ GET CURRENT USER ============
const getMe = async (req, res) => {
    req.user.password = undefined;
    res.status(200).json({ success: true, user: req.user });
};

// ============ LOGOUT ============
const logout = (req, res) => {
    res.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
       .json({ success: true, message: "Logged out" });
};

// ============ ADMIN: CREATE OPERATOR ============
const createOperatorByAdmin = async (req, res, next) => {
    try {
        const { Fname, Lname, email, CompanyName, password, phone, subscriptionPlan, subscriptionStatus } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ErrorHandler("User already exists", 400));
        }

        // Create operator with admin as creator
        const operator = await User.create({
            Fname,
            Lname,
            email,
            password,
            CompanyName,
            phone: phone || '',
            role: 'user',
            isActive: true,
            createdBy: req.user._id,  // ✅ Admin's ID
            subscriptionPlan: subscriptionPlan || 'free',
            subscriptionStatus: subscriptionStatus || 'trial'
        });

        res.status(201).json({
            success: true,
            message: "Operator created successfully",
            user: operator
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
};

// ============ ADMIN: UPDATE OPERATOR ============
const updateOperatorByAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { Fname, Lname, email, CompanyName, phone, isActive, subscriptionPlan, subscriptionStatus } = req.body;

        const operator = await User.findById(id);
        if (!operator) {
            return next(new ErrorHandler("Operator not found", 404));
        }

        // Update fields
        if (Fname) operator.Fname = Fname;
        if (Lname) operator.Lname = Lname;
        if (email) {
            const existing = await User.findOne({ email, _id: { $ne: id } });
            if (existing) {
                return next(new ErrorHandler("Email already in use", 400));
            }
            operator.email = email;
        }
        if (CompanyName) operator.CompanyName = CompanyName;
        if (phone !== undefined) operator.phone = phone;
        if (isActive !== undefined) operator.isActive = isActive;
        if (subscriptionPlan) operator.subscriptionPlan = subscriptionPlan;
        if (subscriptionStatus) operator.subscriptionStatus = subscriptionStatus;

        await operator.save();

        res.status(200).json({
            success: true,
            message: "Operator updated successfully",
            user: operator
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
};

// ============ ADMIN: DELETE OPERATOR ============
const deleteOperatorByAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;

        const operator = await User.findById(id);
        if (!operator) {
            return next(new ErrorHandler("Operator not found", 404));
        }

        // Prevent deleting self
        if (operator._id.toString() === req.user._id.toString()) {
            return next(new ErrorHandler("You cannot delete yourself", 400));
        }

        // Prevent deleting last admin
        if (operator.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return next(new ErrorHandler("Cannot delete the last admin user", 400));
            }
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Operator deleted successfully"
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
};

// ============ ADMIN: TOGGLE OPERATOR STATUS ============
const toggleOperatorStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        const operator = await User.findById(id);
        if (!operator) {
            return next(new ErrorHandler("Operator not found", 404));
        }

        operator.isActive = !operator.isActive;
        await operator.save();

        res.status(200).json({
            success: true,
            message: `Operator ${operator.isActive ? 'activated' : 'deactivated'} successfully`,
            user: operator
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
};

module.exports = {
    createUser,
    loginUser,
    getMe,
    logout,
    createOperatorByAdmin,
    updateOperatorByAdmin,
    deleteOperatorByAdmin,
    toggleOperatorStatus
};