// modules/customer/controllers/authController.js
const User = require('../../../models/User');
const Contact = require('../../../models/Contact');
const jwt = require('jsonwebtoken');

// ============================================
// 1. REGISTER
// ============================================

// modules/customer/controllers/authController.js

const register = async (req, res) => {
    try {
        const { 
            firstName, lastName, email, password, phone,
            operatorId  // ← From the form URL
        } = req.body;

        // Validate operatorId (must be provided)
        if (!operatorId) {
            return res.status(400).json({
                success: false,
                message: 'Operator ID is required. Please register through your operator\'s form.'
            });
        }

        // Verify operator exists
        const operator = await User.findOne({ 
            _id: operatorId,
            role: 'user',
            isActive: true 
        });
        
        if (!operator) {
            return res.status(400).json({
                success: false,
                message: 'Invalid operator. Please contact support.'
            });
        }

        // Check if user already exists
        let existingUser = await User.findOne({ 
            email: email.toLowerCase() 
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered. Please login.'
            });
        }

        // Check if contact exists (maybe guest booking)
        let contact = await Contact.findOne({ 
            email: email.toLowerCase(),
            isDeleted: false
        });

        // Create User
        const user = await User.create({
            Fname: firstName,
            Lname: lastName,
            email: email.toLowerCase(),
            password: password,
            role: 'customer',
            isActive: true,
            phone: phone,
            CompanyName: null
        });

        // Create or update Contact with operatorId
        if (contact) {
            // Update existing contact (from guest booking)
            contact.userId = user._id;
            contact.createdBy = operatorId;  // ← Set operator
            contact.isRegistered = true;
            contact.registrationSource = 'self_register';
            contact.firstName = firstName;
            contact.lastName = lastName;
            if (phone) {
                contact.phone = {
                    number: phone,
                    countryCode: contact.phone?.countryCode || '+1'
                };
            }
            await contact.save();
        } else {
            // Create new contact
            contact = await Contact.create({
                firstName,
                lastName,
                email: email.toLowerCase(),
                phone: { number: phone, countryCode: '+1' },
                userId: user._id,
                createdBy: operatorId,  // ← Set operator from form
                isRegistered: true,
                registrationSource: 'self_register',
                isActive: true
            });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES || '7d' }
        );

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role
            },
            contact: {
                _id: contact._id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                operatorId: contact.createdBy  // ← Return operator
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists. Please login.'
            });
        }
        
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 2. LOGIN
// ============================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with role 'customer'
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            role: 'customer',
            isActive: true
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Get contact profile
        const contact = await Contact.findOne({ 
            userId: user._id,
        });

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES || '7d' }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role
            },
            contact
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 3. UPGRADE GUEST (Operator-created contact)
// ============================================
const upgradeGuest = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;

        const contact = await Contact.findOne({ 
            email: email.toLowerCase(),
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        if (contact.isRegistered) {
            return res.status(400).json({
                success: false,
                message: 'Already registered. Please login.'
            });
        }

        // Check if user exists
        let user = await User.findOne({ 
            email: email.toLowerCase() 
        });
        
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists. Please login.'
            });
        }

        // Create user
        user = await User.create({
            Fname: firstName || contact.firstName,
            Lname: lastName || contact.lastName,
            email: email.toLowerCase(),
            password: password,
            role: 'customer',
            isActive: true,
            phone: phone || contact.phone?.number
        });

        // Update contact
        contact.userId = user._id;
        contact.isRegistered = true;
        contact.registrationSource = 'guest_booking';
        if (firstName) contact.firstName = firstName;
        if (lastName) contact.lastName = lastName;
        if (phone) {
            contact.phone = {
                number: phone,
                countryCode: contact.phone?.countryCode || '+1'
            };
        }
        await contact.save();

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES || '7d' }
        );

        return res.status(200).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role
            },
            contact
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 4. GET PROFILE (Protected - uses middleware)
// ============================================
const getProfile = async (req, res) => {
    try {
        // req.user is set by isAuthenticated middleware
        const user = await User.findById(req.user._id).select('-password');
        
        const contact = await Contact.findOne({ 
            userId: user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role
                },
                contact
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 5. UPDATE PROFILE
// ============================================
const updateProfile = async (req, res) => {
    try {
        const { 
            firstName, lastName, phone, 
            company, homeAddress, workAddress,
            preferences 
        } = req.body;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        // Update contact
        if (firstName) contact.firstName = firstName;
        if (lastName) contact.lastName = lastName;
        if (phone) {
            contact.phone = {
                number: phone,
                countryCode: contact.phone?.countryCode || '+1'
            };
        }
        if (company) contact.company = company;
        if (homeAddress !== undefined) contact.homeAddress = homeAddress;
        if (workAddress !== undefined) contact.workAddress = workAddress;
        if (preferences !== undefined) contact.preferences = preferences;

        await contact.save();

        // Update user name
        if (firstName || lastName) {
            const user = await User.findById(req.user._id);
            if (firstName) user.Fname = firstName;
            if (lastName) user.Lname = lastName;
            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { contact }
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 6. CHANGE PASSWORD
// ============================================
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = {
    register,
    login,
    upgradeGuest,
    getProfile,
    updateProfile,
    changePassword
};