const User = require('../../../models/User');
const Contact = require('../../../models/Contact');
const jwt = require('jsonwebtoken');
const sendToken = require('../../../utils/jwtToken'); 

// ============================================
// 1. REGISTER
// ============================================
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, operatorId } = req.body;

        // Validate operatorId
        if (!operatorId) {
            return res.status(400).json({
                success: false,
                message: 'Operator ID is required'
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
                message: 'Invalid operator'
            });
        }

        // Check if user already exists
        let existingUser = await User.findOne({ 
            email: email.toLowerCase() 
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Check if contact exists
        let contact = await Contact.findOne({ 
            email: email.toLowerCase()
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
            CompanyName: operator.CompanyName || 'Customer'
        });

        // Create or update Contact
        if (contact) {
            contact.userId = user._id;
            contact.createdBy = operatorId;
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
            contact = await Contact.create({
                firstName,
                lastName,
                email: email.toLowerCase(),
                phone: { number: phone, countryCode: '+1' },
                userId: user._id,
                createdBy: operatorId,
                isRegistered: true,
                registrationSource: 'self_register',
                isActive: true
            });
        }

        // ✅ Use sendToken utility
        const message = 'Registration successful';
        sendToken(user, 201, res, message);

    } catch (error) {
        console.error('Registration error:', error);
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

        const user = await User.findOne({ 
            email: email.toLowerCase(),
            role: 'customer',
            isActive: true
        }).select('+password');

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

        // Get contact
        const contact = await Contact.findOne({ 
            userId: user._id
        });

        // ✅ Add contact to user object before sending
        user._doc = user._doc || {};
        user._doc.contact = contact;

        // ✅ Use sendToken utility
        const message = 'Login successful';
        sendToken(user, 200, res, message);

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 3. UPGRADE GUEST
// ============================================
const upgradeGuest = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;

        const contact = await Contact.findOne({ 
            email: email.toLowerCase()
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

        // ✅ Add contact to user object
        user._doc = user._doc || {};
        user._doc.contact = contact;

        // ✅ Use sendToken
        const message = 'Account created successfully';
        sendToken(user, 200, res, message);

    } catch (error) {
        console.error('Upgrade error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 4. LOGOUT
// ============================================
const logout = async (req, res) => {
    try {
        // Clear cookie
        res.cookie('token', '', {
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 5. GET PROFILE
// ============================================
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        const contact = await Contact.findOne({ 
            userId: user._id
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
        console.error('Profile error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 6. UPDATE PROFILE
// ============================================
const updateProfile = async (req, res) => {
    try {
        const { 
            firstName, lastName, phone, 
            company, homeAddress, workAddress,
            preferences 
        } = req.body;

        const contact = await Contact.findOne({ 
            userId: req.user._id
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

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
        console.error('Update profile error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 7. CHANGE PASSWORD
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
        console.error('Change password error:', error);
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
    logout,
    getProfile,
    updateProfile,
    changePassword
};