const Vehicle = require('../../../models/Vehicle');
const Contact = require('../../../models/Contact');

// GET AVAILABLE VEHICLES (CUSTOMER VERSION)
const getAvailableVehicles = async (req, res) => {
    try {
        // 1. Get customer's contact
        const contact = await Contact.findOne({ userId: req.user._id });
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        console.log(contact);

        // 2. Get operator ID from contact
        const operatorId = contact.createdBy;
        if (!operatorId) {
            return res.status(400).json({
                success: false,
                message: 'No operator associated with this account'
            });
        }
        // 3. Get vehicles for that operator (same logic as operator controller)
        const vehicles = await Vehicle.find({ 
            operatorId: operatorId,
            display: true
        })
        .select('name type passengerCapacity images price licensePlate color')
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: vehicles
        });

    } catch (error) {
        console.error('Get vehicles error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAvailableVehicles
};