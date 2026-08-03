// modules/driver/controllers/notificationController.js
const NotificationService = require('../services/notificationService');
const Driver = require('../../../models/settings/Driver');
const Reservation = require('../../../models/Reservation');
const DriverDocument = require('../models/DriverDocument');

// Helper to get driver doc
const getDriverDoc = async (userId) => Driver.findOne({ userId });
const stopAddr = (trip, type) => {
  const s = trip.stops?.find((x) => x.type === type);
  if (!s) return type;
  if (s.locationType === 'airport' && s.airport) return s.airport.code || s.airport.name || 'airport';
  const a = s.address;
  return [a?.street, a?.city].filter(Boolean).join(', ') || `${type} location`;
};

/**
 * Send notification for new trip assignment
 * Called from dispatch/reservation controller when assigning trip
 */
const sendTripAssignedNotification = async (driverId, tripId, io) => {
  try {
    const driver = await Driver.findById(driverId);
    const trip = await Reservation.findById(tripId)
      .populate('bookingContact', 'firstName lastName');

    if (!driver || !trip) {
      console.error('Driver or Trip not found for notification');
      return;
    }

    const notificationService = new NotificationService(io);
    
    const pickupAddress = stopAddr(trip, 'pickup') || 'pickup location';
    const dropoffAddress = stopAddr(trip, 'dropoff') || 'dropoff location';
    const customerName = trip.bookingContact 
      ? `${trip.bookingContact.firstName} ${trip.bookingContact.lastName}` 
      : 'Customer';

    await notificationService.createNotification({
      recipient: driver.userId,
      recipientType: 'User',
      recipientRole: 'driver',
      type: 'new_trip',
      title: 'New Trip Assigned 🚗',
      message: `You have been assigned a new trip from ${pickupAddress} to ${dropoffAddress}`,
      data: {
        tripId: trip._id,
        pickupAddress: pickupAddress,
        dropoffAddress: dropoffAddress,
        scheduledTime: trip.pickupDateTime,
        reservationNumber: trip.reservationNumber,
        customerName: customerName
      },
      priority: 'high',
      actionUrl: `/driver/trips/${trip._id}`
    });

  } catch (error) {
    console.error('Error sending trip assignment notification:', error);
  }
};

/**
 * Send notification for trip status update
 * Called from driver controller when trip status changes
 */
/**
 * Send notification for trip status update
 * Called from driver controller when trip status changes
 */
const sendTripStatusNotification = async (driverId, tripId, status, io) => {
  try {
    const driver = await Driver.findById(driverId);
    const trip = await Reservation.findById(tripId);

    if (!driver || !trip) {
      console.error('Driver or Trip not found for notification');
      return;
    }

    const notificationService = new NotificationService(io);
    
    const statusMessages = {
      'started': {
        title: 'Trip Started 🚗',
        message: `Driver ${driver.firstName} ${driver.lastName} started trip #${trip.reservationNumber || trip._id.slice(-6)}`
      },
      'completed': {
        title: 'Trip Completed ✅',
        message: `Driver ${driver.firstName} ${driver.lastName} completed trip #${trip.reservationNumber || trip._id.slice(-6)}`
      },
      'cancelled': {
        title: 'Trip Cancelled ❌',
        message: `Trip #${trip.reservationNumber || trip._id.slice(-6)} has been cancelled`
      },
      'dispatched': {
        title: 'Trip Dispatched 📍',
        message: `Trip #${trip.reservationNumber || trip._id.slice(-6)} is ready for pickup`
      }
    };

    const statusInfo = statusMessages[status];
    if (!statusInfo) return;

    // For 'started' and 'completed', notify the operator (not the driver)
    if (status === 'started' || status === 'completed') {
      // Notify operator/dispatcher
      if (trip.operatorId) {
        await notificationService.createNotification({
          recipient: trip.operatorId,
          recipientType: 'User',
          recipientRole: 'operator',
          type: 'trip_update',
          title: statusInfo.title,
          message: statusInfo.message,
          data: {
            tripId: trip._id,
            status: status,
            reservationNumber: trip.reservationNumber,
            driverName: `${driver.firstName} ${driver.lastName}`,
            earnings: trip.pricing?.total || 0
          },
          priority: 'high',
          actionUrl: `/operator/trips/${trip._id}`
        });

        console.log(`✅ Trip status notification sent to operator for trip ${trip.reservationNumber}`);
      }

      // Notify customer (existing code - keep as is)
      if (trip.bookingContact) {
        await notificationService.createNotification({
          recipient: trip.bookingContact._id,
          recipientType: 'Contact',
          recipientRole: 'customer',
          type: 'trip_update',
          title: status === 'started' ? 'Your Driver is on the Way 🚗' : 'Trip Completed ✅',
          message: status === 'started' 
            ? `${driver.firstName} ${driver.lastName} has started your trip`
            : 'Your trip has been completed. Thank you for riding with us!',
          data: {
            tripId: trip._id,
            driverName: `${driver.firstName} ${driver.lastName}`,
            status: status
          },
          priority: 'high',
          actionUrl: `/customer/trips/${trip._id}`
        });
      }
    } 
    // For 'cancelled' and 'dispatched', keep the existing behavior (notify driver)
    else {
      await notificationService.createNotification({
        recipient: driver.userId,
        recipientType: 'User',
        recipientRole: 'driver',
        type: 'trip_update',
        title: statusInfo.title,
        message: statusInfo.message,
        data: {
          tripId: trip._id,
          status: status,
          reservationNumber: trip.reservationNumber,
          earnings: trip.pricing?.total || 0
        },
        priority: status === 'cancelled' ? 'high' : 'medium',
        actionUrl: `/driver/trips/${trip._id}`
      });

      console.log(`✅ Trip status notification sent to driver ${driver.firstName}`);
    }
  } catch (error) {
    console.error('Error sending trip status notification:', error);
  }
};

/**
 * Send notification for document upload/status update
 * Called from document controller
 */
const sendDocumentNotification = async (driverId, document, status, io) => {
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      console.error('Driver not found for notification');
      return;
    }

    const notificationService = new NotificationService(io);
    
    const statusMessages = {
      'uploaded': {
        title: 'Document Uploaded 📄',
        message: `Your ${document.displayName} has been uploaded and is pending review`,
        type: 'document_approved'
      },
      'approved': {
        title: 'Document Approved ✅',
        message: `Your ${document.displayName} has been approved!`,
        type: 'document_approved'
      },
      'rejected': {
        title: 'Document Rejected ❌',
        message: `Your ${document.displayName} has been rejected${document.rejectionReason ? `: ${document.rejectionReason}` : ''}`,
        type: 'document_rejected'
      },
      'expiring': {
        title: 'Document Expiring Soon ⚠️',
        message: `Your ${document.displayName} will expire on ${new Date(document.expiryDate).toLocaleDateString()}`,
        type: 'document_rejected'
      }
    };

    const statusInfo = statusMessages[status];
    if (!statusInfo) return;

    await notificationService.createNotification({
      recipient: driver.userId,
      recipientType: 'User',
      recipientRole: 'driver',
      type: statusInfo.type,
      title: statusInfo.title,
      message: statusInfo.message,
      data: {
        documentId: document._id,
        documentType: document.type,
        displayName: document.displayName,
        status: status,
        expiryDate: document.expiryDate
      },
      priority: status === 'rejected' || status === 'expiring' ? 'high' : 'medium',
      actionUrl: `/driver/profile#documents`
    });

    console.log(`✅ Document notification sent to driver ${driver.firstName}`);
  } catch (error) {
    console.error('Error sending document notification:', error);
  }
};

/**
 * Send notification for payment received
 * Called from payment controller when driver gets paid
 */
const sendPaymentNotification = async (driverId, tripId, amount, io) => {
  try {
    const driver = await Driver.findById(driverId);
    const trip = await Reservation.findById(tripId);

    if (!driver || !trip) {
      console.error('Driver or Trip not found for notification');
      return;
    }

    const notificationService = new NotificationService(io);

    await notificationService.createNotification({
      recipient: driver.userId,
      recipientType: 'User',
      recipientRole: 'driver',
      type: 'payment_received',
      title: 'Payment Received 💰',
      message: `You received $${amount.toFixed(2)} for trip #${trip.reservationNumber || trip._id.slice(-6)}`,
      data: {
        tripId: trip._id,
        amount: amount,
        reservationNumber: trip.reservationNumber
      },
      priority: 'medium',
      actionUrl: `/driver/earnings`
    });

    console.log(`✅ Payment notification sent to driver ${driver.firstName}`);
  } catch (error) {
    console.error('Error sending payment notification:', error);
  }
};

/**
 * Send notification for availability status change
 * Called from driver controller when toggling availability
 */
const sendAvailabilityNotification = async (driverId, isAvailable, io) => {
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      console.error('Driver not found for notification');
      return;
    }

    const notificationService = new NotificationService(io);

    await notificationService.createNotification({
      recipient: driver.userId,
      recipientType: 'User',
      recipientRole: 'driver',
      type: 'system_alert',
      title: isAvailable ? 'You are Online 🟢' : 'You are Offline 🔴',
      message: isAvailable 
        ? 'You are now available to receive trip assignments' 
        : 'You are now offline and will not receive new trips',
      data: {
        isAvailable: isAvailable
      },
      priority: 'low'
    });

    console.log(`✅ Availability notification sent to driver ${driver.firstName}`);
  } catch (error) {
    console.error('Error sending availability notification:', error);
  }
};

/**
 * Send notification for expiring documents (cron job)
 */
const sendExpiringDocumentNotifications = async (io) => {
  try {
    const notificationService = new NotificationService(io);
    
    // Get documents expiring in next 15 days
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
    
    const expiringDocs = await DriverDocument.find({
      expiryDate: { 
        $ne: null,
        $lte: fifteenDaysFromNow,
        $gte: new Date()
      },
      status: { $ne: 'expired' }
    }).populate('driver');

    for (const doc of expiringDocs) {
      if (doc.driver && doc.driver.userId) {
        await notificationService.createNotification({
          recipient: doc.driver.userId,
          recipientType: 'User',
          recipientRole: 'driver',
          type: 'document_rejected',
          title: 'Document Expiring Soon ⚠️',
          message: `Your ${doc.displayName} will expire on ${new Date(doc.expiryDate).toLocaleDateString()}. Please upload a new one.`,
          data: {
            documentId: doc._id,
            documentType: doc.type,
            displayName: doc.displayName,
            expiryDate: doc.expiryDate
          },
          priority: 'high',
          actionUrl: `/driver/profile#documents`
        });
      }
    }

    console.log(`✅ Sent ${expiringDocs.length} expiring document notifications`);
  } catch (error) {
    console.error('Error sending expiring document notifications:', error);
  }
};

module.exports = {
  sendTripAssignedNotification,
  sendTripStatusNotification,
  sendDocumentNotification,
  sendPaymentNotification,
  sendAvailabilityNotification,
  sendExpiringDocumentNotifications
};