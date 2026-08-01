const http = require('http');
const socketIo = require('socket.io'); 

if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "./.env",
  });
}

const app= require('./app')
const dbConnect = require('./db/dbConnect');
const cloudinary = require('cloudinary')


//Handling uncaught exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling uncaught exception`);
});


// calling database connection function
dbConnect()

// ============ CREATE HTTP SERVER ============
const server = http.createServer(app); // ← ADD THIS

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

// ============ SOCKET.IO CONNECTION HANDLER ============
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Get driver ID from query params
  const driverId = socket.handshake.query.driverId;
  const userId = socket.handshake.query.userId;
  const role = socket.handshake.query.role;
  
  if (driverId && role === 'driver') {
    // Join driver's room
    socket.join(`driver-${driverId}`);
    connectedDrivers.set(driverId, {
      socketId: socket.id,
      userId: userId,
      connectedAt: new Date()
    });
    console.log(`Driver ${driverId} connected. Total drivers: ${connectedDrivers.size}`);
    
    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to WebSocket server',
      driverId: driverId,
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove from connected drivers
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
// For local development - start server
if (process.env.NODE_ENV !== "PRODUCTION") {
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => { // ← CHANGE: app.listen → server.listen
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