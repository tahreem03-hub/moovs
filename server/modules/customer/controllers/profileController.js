// modules/customer/controllers/profileController.js
const Contact = require('../../../models/Contact');

// ============================================
// 1. GET SAVED ADDRESSES
// ============================================
const getAddresses = async (req, res) => {
    try {
        const contact = await Contact.findOne({ 
            userId: req.user._id,
        });
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }
        const addresses = [];
        if (contact.homeAddress) {
            addresses.push({
                id: 'home',
                label: 'Home',
                address: contact.homeAddress,
                isDefault: true
            });
        }
        if (contact.workAddress) {
            addresses.push({
                id: 'work',
                label: 'Work',
                address: contact.workAddress,
                isDefault: false
            });
        }

        return res.status(200).json({
            success: true,
            data: addresses
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 2. UPDATE ADDRESS
// ============================================
const updateAddress = async (req, res) => {
    try {
        const { type, address } = req.body;

        if (!type || !address) {
            return res.status(400).json({
                success: false,
                message: 'Type and address are required'
            });
        }

        if (!['home', 'work'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be "home" or "work"'
            });
        }

        const updateData = {};
        if (type === 'home') {
            updateData.homeAddress = address;
        } else {
            updateData.workAddress = address;
        }

        const contact = await Contact.findOneAndUpdate(
            { userId: req.user._id},
            updateData,
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: `${type} address updated successfully`,
            data: {
                homeAddress: contact.homeAddress,
                workAddress: contact.workAddress
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
// 3. DELETE ADDRESS
// ============================================
const deleteAddress = async (req, res) => {
    try {
        const { type } = req.params;

        if (!['home', 'work'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be "home" or "work"'
            });
        }

        const updateData = {};
        if (type === 'home') {
            updateData.homeAddress = null;
        } else {
            updateData.workAddress = null;
        }

        const contact = await Contact.findOneAndUpdate(
            { userId: req.user._id},
            updateData,
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: `${type} address deleted successfully`,
            data: {
                homeAddress: contact.homeAddress,
                workAddress: contact.workAddress
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
// 4. GET NOTIFICATION PREFERENCES
// ============================================
const getNotificationPreferences = async (req, res) => {
    try {
        const contact = await Contact.findOne({ 
            userId: req.user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const preferences = contact.notificationPreferences || {
            email: {
                bookingConfirmed: true,
                driverEnRoute: true,
                receipt: true,
                reviewRequest: true,
                promos: false
            },
            sms: {
                bookingConfirmed: true,
                driverEnRoute: true,
                receipt: false,
                promos: false
            },
            push: {
                bookingConfirmed: true,
                driverEnRoute: true,
                receipt: false,
                promos: false
            }
        };

        return res.status(200).json({
            success: true,
            data: preferences
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 5. UPDATE NOTIFICATION PREFERENCES
// ============================================
const updateNotificationPreferences = async (req, res) => {
    try {
        const { preferences } = req.body;

        if (!preferences) {
            return res.status(400).json({
                success: false,
                message: 'Preferences are required'
            });
        }

        const contact = await Contact.findOneAndUpdate(
            { userId: req.user._id},
            { notificationPreferences: preferences },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification preferences updated',
            data: contact.notificationPreferences
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 6. UPDATE COMPANY INFO
// ============================================
const updateCompany = async (req, res) => {
    try {
        const { company, position } = req.body;

        const contact = await Contact.findOneAndUpdate(
            { userId: req.user._id},
            { 
                company: company,
                companyPosition: position
            },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Company info updated successfully',
            data: {
                company: contact.company,
                position: contact.companyPosition
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
// 7. UPDATE PREFERENCES
// ============================================
const updatePreferences = async (req, res) => {
    try {
        const { preferences } = req.body;

        const contact = await Contact.findOneAndUpdate(
            { userId: req.user._id},
            { preferences: preferences },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Preferences updated successfully',
            data: contact.preferences
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 8. GET LINKED PASSENGERS
// ============================================
const getLinkedPassengers = async (req, res) => {
    try {
        const contact = await Contact.findOne({ 
            userId: req.user._id,
        })
        .populate('linkedPassengers', 'firstName lastName email phone');

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: contact.linkedPassengers || []
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 9. ADD LINKED PASSENGER
// ============================================
const addLinkedPassenger = async (req, res) => {
    try {
        const { passengerId } = req.body;

        if (!passengerId) {
            return res.status(400).json({
                success: false,
                message: 'Passenger ID is required'
            });
        }

        const contact = await Contact.findOne({ 
            userId: req.user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        if (!contact.linkedPassengers) {
            contact.linkedPassengers = [];
        }

        if (contact.linkedPassengers.includes(passengerId)) {
            return res.status(400).json({
                success: false,
                message: 'Passenger already linked'
            });
        }

        // Verify passenger exists
        const passenger = await Contact.findById(passengerId);
        if (!passenger) {
            return res.status(404).json({
                success: false,
                message: 'Passenger not found'
            });
        }

        contact.linkedPassengers.push(passengerId);
        await contact.save();

        await contact.populate('linkedPassengers', 'firstName lastName email phone');

        return res.status(200).json({
            success: true,
            message: 'Passenger linked successfully',
            data: contact.linkedPassengers
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// 10. REMOVE LINKED PASSENGER
// ============================================
const removeLinkedPassenger = async (req, res) => {
    try {
        const { passengerId } = req.params;

        const contact = await Contact.findOne({ 
            userId: req.user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        contact.linkedPassengers = contact.linkedPassengers.filter(
            id => id.toString() !== passengerId
        );
        await contact.save();

        await contact.populate('linkedPassengers', 'firstName lastName email phone');

        return res.status(200).json({
            success: true,
            message: 'Passenger removed successfully',
            data: contact.linkedPassengers
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = {
    // Addresses
    getAddresses,
    updateAddress,
    deleteAddress,
    
    // Notifications
    getNotificationPreferences,
    updateNotificationPreferences,
    
    // Company
    updateCompany,
    
    // Preferences
    updatePreferences,
    
    // Linked Passengers
    getLinkedPassengers,
    addLinkedPassenger,
    removeLinkedPassenger
};