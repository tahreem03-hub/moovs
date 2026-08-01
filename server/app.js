const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser')
const cors = require('cors')
const app = express();
const errorHandler = require('./middleware/error')



// CORS HERE - BEFORE ANY ROUTES
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
}));

// Then body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ============ IMPORT MODULES ============
const { adminRoutes } = require('./modules/admin');
const driverModule = require('./modules/driver');
const { customerRoutes } = require('./modules/customer');


// Import modular admin routes
const { subscriptionRoutes } = require('./modules/admin');


// THEN routes
const userRouter = require('./routes/user')
const quoteRouter = require('./routes/quote')
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
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
app.use('/payment', paymentRoutes);
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
app.use('/settings/driver', require('./routes/settings/driverRoutes'));
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


app.use('/driver', driverModule);

// Customer routes
app.use('/customer', customerRoutes);


app.use(errorHandler);

module.exports = app;