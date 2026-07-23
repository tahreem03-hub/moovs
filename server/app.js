const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser')
const app = express();
const cors = require('cors')
const errorHandler = require('./middleware/error')

// Import modular admin routes
const { adminRoutes, subscriptionRoutes } = require('./modules/admin');


// CORS HERE - BEFORE ANY ROUTES
app.use(cors({
  origin: 'http://localhost:5174', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Then body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// THEN routes
const userRouter = require('./routes/user')
const quoteRouter = require('./routes/quote')
const reservationRoutes = require('./routes/reservationRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const driverTrackingRoutes = require('./routes/driverTrackingRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const payableRoutes = require('./routes/payableRoutes');
const crmRoutes = require('./routes/crmRoutes');
const vehicleRouter = require('./routes/vehicle')
const contactRouter = require('./routes/contact')
const companyRouter = require('./routes/company')
const cancellationRouter = require('./routes/settings/cancellationRoutes')
const billingRoutes = require('./routes/settings/billingRoutes');
const billingAdminRoutes = require('./modules/admin/routes/billingAdminRoutes');

app.use('/user', userRouter);
app.use('/quote', quoteRouter);
app.use('/reservation', reservationRoutes);
app.use('/dispatch', dispatchRoutes);
app.use('/driver-tracking', driverTrackingRoutes);
app.use('/vehicle', vehicleRouter);
app.use('/contact', contactRouter)
app.use('/company', companyRouter)
app.use('/invoice', invoiceRoutes);
app.use('/payable', payableRoutes);
app.use('/crm', crmRoutes);

app.use('/cancellation', cancellationRouter)
app.use('/insurance', require('./routes/settings/insuranceRoutes'));
app.use('/terms', require('./routes/settings/termsRoutes'));
app.use('/driver', require('./routes/settings/driverRoutes'));
app.use('/member', require('./routes/settings/memberRoutes'));
app.use('/company-profile', require('./routes/settings/conpanyProfileRoutes'));
app.use('/trip-rules', require('./routes/settings/tripRuleRoutes'));

app.use('/customer-portal', require('./routes/settings/customerPortalRoutes'))
// Operator billing
app.use('/billing', billingRoutes);
// Admin billing
app.use('/admin/billing', billingAdminRoutes);



// Use routes
app.use('/admin', adminRoutes);
app.use('/admin/subscriptions', subscriptionRoutes);


app.use(errorHandler);

module.exports = app;