// modules/customer/routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const { 
    isAuthenticated, 
    authorizeCustomer 
} = require('../../../middleware/auth');

// ============================================
// CONTROLLERS
// ============================================
const {
    register,
    login,
    upgradeGuest,
    logout,  
    getProfile,
    updateProfile,
    changePassword
} = require('../controllers/authController');

const {
    getAddresses,
    updateAddress,
    deleteAddress,
    getNotificationPreferences,
    updateNotificationPreferences,
    updateCompany,
    updatePreferences,
    getLinkedPassengers,
    addLinkedPassenger,
    removeLinkedPassenger
} = require('../controllers/profileController');

const {
    getHome,
    getStats
} = require('../controllers/dashboardController');

const {
    createReservation,
    getReservations,
    getReservationDetail,
    cancelReservation,
    rebookReservation,
    rateAndTip
} = require('../controllers/bookingController');

const {
    getActiveRide,
    trackRide,
    getDriverLocation
} = require('../controllers/trackingController');

const {
    getPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    getPaymentHistory,
    payInvoice
} = require('../controllers/paymentController');

const {
    getInvoices,
    getInvoiceDetail,
    downloadInvoicePDF
} = require('../controllers/invoiceController');

const {
    getCashbackSummary,
    getCashbackLedger
} = require('../controllers/cashbackController');


const { getAvailableVehicles } = require('../controllers/vehicleController');


// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/upgrade', upgradeGuest);
router.get('/auth/logout', logout);  // ← Add logout route

// ============================================
// PROTECTED ROUTES
// ============================================
router.use(isAuthenticated);
router.use(authorizeCustomer);

// ============ DASHBOARD ============
router.get('/dashboard/home', getHome);
router.get('/dashboard/stats', getStats);

// ============ PROFILE ============
// Basic Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/password', changePassword);

// Addresses (using Contact homeAddress/workAddress fields)
router.get('/profile/addresses', getAddresses);
router.put('/profile/addresses', updateAddress);        // body: { type: 'home'|'work', address: '...' }
router.delete('/profile/addresses/:type', deleteAddress); // type: 'home'|'work'

// Company Info
router.put('/profile/company', updateCompany);          // body: { company, position }

// Preferences
router.put('/profile/preferences', updatePreferences);  // body: { preferences: '...' }

// Linked Passengers
router.get('/profile/passengers', getLinkedPassengers);
router.post('/profile/passengers', addLinkedPassenger); // body: { passengerId }
router.delete('/profile/passengers/:passengerId', removeLinkedPassenger);

// Notification Preferences
router.get('/profile/notifications', getNotificationPreferences);
router.put('/profile/notifications', updateNotificationPreferences);


// ============ RESERVATIONS ============
router.get('/reservations', getReservations);
router.get('/reservations/:id', getReservationDetail);
router.post('/reservations', createReservation);
router.post('/reservations/:id/cancel', cancelReservation);
router.post('/reservations/:id/rebook', rebookReservation);
router.post('/reservations/:id/rate', rateAndTip);

// ============ TRACKING ============
router.get('/tracking/active', getActiveRide);
router.get('/tracking/:id', trackRide);
router.get('/tracking/driver/:reservationId/location', getDriverLocation);

// ============ PAYMENTS ============
// Payment Methods (stored in Contact.paymentMethods array)
router.get('/payment-methods', getPaymentMethods);
router.post('/payment-methods', addPaymentMethod);
router.delete('/payment-methods/:id', deletePaymentMethod);
router.put('/payment-methods/:id/default', setDefaultPaymentMethod);

// Payment History
router.get('/payments', getPaymentHistory);

// Pay Invoice
router.post('/invoices/:id/pay', payInvoice);

// ============ INVOICES ============
router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoiceDetail);
router.get('/invoices/:id/download', downloadInvoicePDF);

// ============ CASHBACK ============
router.get('/cashback', getCashbackSummary);
router.get('/cashback/ledger', getCashbackLedger);


// ============================================
// VEHICLES (Customer)
// ============================================
router.get('/vehicles', getAvailableVehicles);

// ============ GUEST BOOKING (Optional - Allow guest to book without auth) ============
// router.post('/guest/book', guestBooking);

module.exports = router;