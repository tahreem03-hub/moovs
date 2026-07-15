const Quote = require("../models/Quote");
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/ErrorHandler");

const createQuote = catchAsyncError(async (req, res, next) => {
    const {
        bookingContact,
        orderType,
        assignedMember,
        tripType,
        passenger,
        pickupDateTime,
        dropoffDateTime,
        stops,
        passengerCount,
        driverNote,
        tripNotes,
        vehicle,
        pricing,
        internalComments,
        status,
    } = req.body;

    // Basic validation
    // Pickup date cannot be in the past
    if (new Date(pickupDateTime) < new Date()) {
        return next(
            new ErrorHandler("Pickup date cannot be in the past", 400)
        );
    }

    // Dropoff must be after pickup
    if (
        dropoffDateTime &&
        new Date(dropoffDateTime) <= new Date(pickupDateTime)
    ) {
        return next(
            new ErrorHandler("Dropoff must be after pickup time", 400)
        );
    }

    if (!bookingContact)
        return next(new ErrorHandler("Booking contact is required.", 400));

    if (!assignedMember)
        return next(new ErrorHandler("Assigned member is required.", 400));

    if (!pickupDateTime)
        return next(new ErrorHandler("Pickup date & time is required.", 400));

    if (!vehicle)
        return next(new ErrorHandler("Vehicle is required.", 400));

    if (!stops || stops.length < 2)
        return next(
            new ErrorHandler("At least a pickup and dropoff stop are required.", 400)
        );

    const quote = await Quote.create({
        bookingContact,
        orderType,
        assignedMember,
        tripType,
        passenger,
        pickupDateTime,
        dropoffDateTime,
        stops,
        passengerCount,
        driverNote,
        tripNotes,
        vehicle,
        pricing,
        internalComments,
        status,
        createdBy: req.user._id, // from auth middleware
    });

    res.status(201).json({
        success: true,
        message: "Quote created successfully.",
        quote,
    });
});

module.exports = {
    createQuote,
}