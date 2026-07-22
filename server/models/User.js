const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    Fname: {
        type: String,
        required: [true, "Please enter your name!"],
    },
    Lname: {
        type: String,
        required: [true, "Please enter your name!"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email!"],
        unique: true,
        trim: true,
        lowercase: true,
    },
    CompanyName: {
        type: String,
        required: [true, "Please enter your company name!"]
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: [4, "Password should be greater than 4 characters"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },

    // Admin Management Fields
    phone: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subscriptionPlan: {
        type: String,
        enum: ['free', 'basic', 'pro', 'enterprise'],
        default: 'free'
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'inactive', 'trial', 'expired'],
        default: 'trial'
    },
    subscriptionExpiry: {
        type: Date
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    // ============ CREATED BY (Who created this user) ============
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,  // null = self-registered
        index: true
    }

});

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES,
    });
};

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model("User", userSchema);