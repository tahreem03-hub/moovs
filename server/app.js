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
  origin: 'http://localhost:5173', // Your frontend URL
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
const vehicleRouter = require('./routes/vehicle')
const contactRouter = require('./routes/contact')
const companyRouter = require('./routes/company')
const cancellationRouter = require('./routes/cancellationRoutes')

app.use('/user', userRouter);
app.use('/quote', quoteRouter);
app.use('/vehicle', vehicleRouter);
app.use('/contact', contactRouter)
app.use('/company', companyRouter)

app.use('/cancellation', cancellationRouter)
app.use('/insurance', require('./routes/insuranceRoutes'));
app.use('/terms', require('./routes/termsRoutes'));
app.use('/driver', require('./routes/driverRoutes'));
app.use('/member', require('./routes/memberRoutes'));
app.use('/company-profile', require('./routes/conpanyProfileRoutes'));
app.use('/trip-rules', require('./routes/tripRuleRoutes'));

app.use('/customer-portal', require('./routes/customerPortalRoutes'))



// Use routes
app.use('/admin', adminRoutes);
app.use('/admin/subscriptions', subscriptionRoutes);


app.use(errorHandler);

module.exports = app;