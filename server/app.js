const express = require('express');
const cookieParser = require('cookie-parser')
const app = express();
const cors = require('cors')
const errorHandler = require('./middleware/error')

const userRouter = require('./routes/user')
const quoteRouter=require('./routes/quote')
const vehicleRouter=require('./routes/vehicle')


app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded());
app.use(cors({
        origin: "http://localhost:5173",
        credentials: true,
    }))



app.use('/user', userRouter);
app.use('/quote', quoteRouter);
app.use('/vehicle', vehicleRouter);


// Error handling
app.use(errorHandler);


module.exports = app;

