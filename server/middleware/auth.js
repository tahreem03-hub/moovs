// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const catchAsyncError = require('./catchAsyncError');
const ErrorHandler = require("../utils/ErrorHandler");

const isAuthenticated = catchAsyncError(async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return next(new ErrorHandler("Please login first", 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Check if user is active (for all roles)
        if (!user.isActive) {
            return next(new ErrorHandler("Your account has been deactivated. Please contact support.", 403));
        }

        req.user = user;
        next();
    } catch (error) {
        next(new ErrorHandler(error.message, 401));
    }
});

// AUTHORIZE MIDDLEWARE - Check user role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, please login'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(', ')}`
            });
        }

        next();
    };
};

// AUTHORIZE ADMIN (Shortcut)
const authorizeAdmin = authorize('admin');

// AUTHORIZE OPERATOR (Shortcut)
const authorizeOperator = authorize('user');

// AUTHORIZE DRIVER (Shortcut)
const authorizeDriver = authorize('driver');

// AUTHORIZE CUSTOMER (Shortcut)
const authorizeCustomer = authorize('customer');

// AUTHORIZE ADMIN OR OPERATOR
const authorizeAdminOrOperator = authorize('admin', 'user');

// AUTHORIZE ANY ROLE (Just check if logged in)
const authorizeAny = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, please login'
        });
    }
    next();
};

module.exports = {
    isAuthenticated,
    authorize,
    authorizeAdmin,
    authorizeOperator,
    authorizeDriver,
    authorizeCustomer,
    authorizeAdminOrOperator,
    authorizeAny
};