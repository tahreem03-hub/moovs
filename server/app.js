const express = require('express');
const cookieParser = require('cookie-parser')
const app = express();
const cors = require('cors')
const errorHandler = require('./middleware/error')

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded());
app.use(cors({
        origin: "http://localhost:5173",
        credentials: true,
    }))

const userRouter = require('./routes/user')

app.use('/user', userRouter);


// Error handling
app.use(errorHandler);


module.exports = app;

