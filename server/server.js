const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "./.env",
  });
}

const app = require('./app');
const dbConnect = require('./db/dbConnect');
const cloudinary = require('cloudinary');

// Handling uncaught exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling uncaught exception`);
});

// calling database connection function
dbConnect();

// ============ CREATE HTTP SERVER ============
const server = http.createServer(app);

// ============ INITIALIZE SOCKET.IO ============
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
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
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// ============ STORE CONNECTED DRIVERS ============
const connectedDrivers = new Map();

// ============ AUTH MIDDLEWARE (verify token BEFORE connection) ============
io.use((socket, next) => {
  try {
    const raw = socket.handshake.headers.cookie || '';
    const { token } = cookie.parse(raw);
    if (!token) return next(new Error('Unauthorized'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    socket.userId = decoded.id; // trust the verified token, not the query param
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});

// ============ SOCKET.IO CONNECTION HANDLER ============
io.on('connection', (socket) => {
  const userId = socket.userId;              // from the verified token
  const role = socket.handshake.query.role;  // role is fine to read from query

  console.log('New client connected:', socket.id);

  if (userId && role === 'driver') {
    // Room is keyed on the verified user id — matches the notification service's
    // `driver-<recipient>` where recipient = driver.userId
    socket.join(`driver-${userId}`);

    connectedDrivers.set(userId, {
      socketId: socket.id,
      connectedAt: new Date()
    });
    console.log(`Driver ${userId} connected. Total drivers: ${connectedDrivers.size}`);

    socket.emit('connected', {
      message: 'Connected to WebSocket server',
      userId: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const [key, value] of connectedDrivers.entries()) {
      if (value.socketId === socket.id) {
        connectedDrivers.delete(key);
        console.log(`Driver ${key} disconnected. Total drivers: ${connectedDrivers.size}`);
        break;
      }
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// ============ MAKE IO AND CONNECTED DRIVERS AVAILABLE TO APP ============
app.set('io', io);
app.set('connectedDrivers', connectedDrivers);

// ============ START SERVER ============
if (process.env.NODE_ENV !== "PRODUCTION") {
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`WebSocket server is running on ws://localhost:${PORT}`);
  });
}

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);
});

// Export for Vercel
module.exports = { app, server, io };