const jwt = require("jsonwebtoken");
const User = require("../models/User");
const catchAsyncError = require('./catchAsyncError')
const ErrorHandler = require("../utils/ErrorHandler");

const isAuthenticated = catchAsyncError (async(req, res, next) => {
    try {

        const { token } = req.cookies;

        if (!token) {
            return next(new ErrorHandler("Please login first", 401));
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY
        );

        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        req.user = user;

        next();

    } catch (error) {
        next(new ErrorHandler(error.message, 401));
    }
});


// middleware/auth.js
// Add authorize middleware for admin

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
        message: `Not authorized. Required role: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

module.exports = { isAuthenticated, authorize };